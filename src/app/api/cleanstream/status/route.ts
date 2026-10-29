import { NextResponse } from "next/server";

export const runtime = "edge";

interface ServerStatus {
  name: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  cleanstream_working: boolean;
  latency_ms: number;
  note?: string;
}

let cachedResult: {
  timestamp: number;
  data: {
    cleanstream_online: boolean;
    cleanstream_url: string;
    latency_ms: number;
    servers: Record<string, ServerStatus>;
    active_count: number;
    total_count: number;
  };
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 60s cache

export async function GET() {
  const now = Date.now();
  if (cachedResult && now - cachedResult.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResult.data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }

  const cleanstreamUrl =
    process.env.NEXT_PUBLIC_CLEANSTREAM_URL ||
    "https://marriage-editorials-tyler-clark.trycloudflare.com";

  const t0 = Date.now();
  let cleanstreamOnline = false;
  let latencyMs = 0;

  try {
    const res = await fetch(`${cleanstreamUrl}/api/resolve`, {
      method: "GET",
      signal: AbortSignal.timeout(6000),
    });
    latencyMs = Date.now() - t0;
    // Status 400 with "Missing 'url' query parameter" means service is UP and listening!
    cleanstreamOnline = res.status === 200 || res.status === 400;
  } catch {
    latencyMs = Date.now() - t0;
    cleanstreamOnline = false;
  }

  // Sample tests for primary hosts
  const testHosts: Record<string, string> = {
    Streamtape: "https://streamtape.com/v/qraxMqwboYcyrR",
    Mixdrop: "https://mxdrop.click/f/4ddrqwwzaolqxl",
    StreamLU: "https://streamhihi.com/e/6ro23a6kc5iz",
    StreamEA: "https://javplaya.com/embed/vm4fwg89u94z",
  };

  const servers: Record<string, ServerStatus> = {};

  if (cleanstreamOnline) {
    const checks = Object.entries(testHosts).map(async ([name, url]) => {
      const start = Date.now();
      try {
        const resolveRes = await fetch(
          `${cleanstreamUrl}/api/resolve?url=${encodeURIComponent(url)}`,
          {
            signal: AbortSignal.timeout(8000),
          }
        );
        const elapsed = Date.now() - start;
        if (!resolveRes.ok) {
          return {
            name,
            status: "OFFLINE" as const,
            cleanstream_working: false,
            latency_ms: elapsed,
            note: `HTTP ${resolveRes.status}`,
          };
        }
        const data = await resolveRes.json();
        const ok = Boolean(data && data.success && (data.stream_url || data.proxy_url));
        return {
          name,
          status: (ok ? "ONLINE" : "OFFLINE") as "ONLINE" | "OFFLINE",
          cleanstream_working: ok,
          latency_ms: elapsed,
          note: ok ? "CleanStream Protected" : data?.error || "Resolve failed",
        };
      } catch (err: unknown) {
        const elapsed = Date.now() - start;
        return {
          name,
          status: "OFFLINE" as const,
          cleanstream_working: false,
          latency_ms: elapsed,
          note: err instanceof Error ? err.message : "Timeout/Error",
        };
      }
    });

    const results = await Promise.all(checks);
    for (const r of results) {
      servers[r.name] = r;
    }
  } else {
    for (const name of Object.keys(testHosts)) {
      servers[name] = {
        name,
        status: "OFFLINE",
        cleanstream_working: false,
        latency_ms: 0,
        note: "CleanStream Unreachable",
      };
    }
  }

  const activeCount = Object.values(servers).filter((s) => s.cleanstream_working).length;
  const totalCount = Object.keys(servers).length;

  const resultData = {
    cleanstream_online: cleanstreamOnline,
    cleanstream_url: cleanstreamUrl,
    latency_ms: latencyMs,
    servers,
    active_count: activeCount,
    total_count: totalCount,
  };

  cachedResult = {
    timestamp: now,
    data: resultData,
  };

  return NextResponse.json(resultData, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

