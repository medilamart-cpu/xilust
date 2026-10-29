#!/usr/bin/env python3
"""
CleanStream Server & Video Host Status Bot
==========================================
Monitors and verifies:
1. Core Infrastructure (CleanStream VPS, Catalog API, Thumbs HTTP, Cloudflare Tunnels)
2. Streaming Video Hosts on CleanStream:
   - Streamtape
   - Mixdrop
   - Doodstream / Playmogo
   - JavClan / StreamSB
   - StreamHiHi / StreamLU
   - MaxStream / StreamJK
   - Vide0 / StreamDD
   - VidHide / StreamEA
   - VOE / StreamVO
   - StreamAV / OppaiNet

Modes:
- CLI check:           python scripts/cleanstream_status_bot.py
- JSON output:         python scripts/cleanstream_status_bot.py --json
- Live Watch / Daemon: python scripts/cleanstream_status_bot.py --monitor --interval 300
- Telegram Bot:        python scripts/cleanstream_status_bot.py --telegram [--token <BOT_TOKEN>]
"""

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime

# Configure utf-8 console output for Windows
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Default configuration
CLEANSTREAM_URL = os.environ.get(
    "NEXT_PUBLIC_CLEANSTREAM_URL", "https://marriage-editorials-tyler-clark.trycloudflare.com"
).rstrip("/")
CATALOG_API_URL = os.environ.get(
    "CATALOG_API_URL", "https://revenue-substitute-summaries-subject.trycloudflare.com"
).rstrip("/")
THUMBS_CDN_URL = os.environ.get(
    "NEXT_PUBLIC_THUMBS_CDN", "https://interventions-precision-stake-alternate.trycloudflare.com"
).rstrip("/")

# Known sample test links for live verification through CleanStream
SAMPLE_HOSTS = {
    "Streamtape": {
        "label": "Streamtape",
        "url": "https://streamtape.com/v/qraxMqwboYcyrR",
        "category": "Direct MP4 Proxy",
        "description": "Ad-free MP4 token resolver & VPS stream proxy",
    },
    "Mixdrop": {
        "label": "Mixdrop",
        "url": "https://mxdrop.click/f/4ddrqwwzaolqxl",
        "category": "Direct MP4 Proxy",
        "description": "Dean-Edwards packed unpacker & direct media CDN",
    },
    "Doodstream": {
        "label": "Doodstream",
        "url": "https://playmogo.com/d/uy47m01f2ibd",
        "category": "Direct MP4 Proxy",
        "description": "pass_md5 token generator & reverse proxy",
    },
    "StreamSB (JavClan)": {
        "label": "StreamSB",
        "url": "https://javclan.com/v/sample123",
        "category": "HLS Gateway",
        "description": "Master playlist m3u8 extractor",
    },
    "StreamLU (StreamHiHi)": {
        "label": "StreamLU",
        "url": "https://streamhihi.com/e/6ro23a6kc5iz",
        "category": "HLS Gateway",
        "description": "LuluStream high-speed HLS gateway",
    },
    "StreamJK (MaxStream)": {
        "label": "StreamJK",
        "url": "https://maxstream.org/e/sample",
        "category": "HLS Gateway",
        "description": "MaxStream HLS player gateway",
    },
    "StreamDD (Vide0)": {
        "label": "StreamDD",
        "url": "https://vide0.net/v/sample",
        "category": "Direct / HLS",
        "description": "Vide0 clean embed gateway",
    },
    "StreamEA (VidHide)": {
        "label": "StreamEA",
        "url": "https://javplaya.com/embed/vm4fwg89u94z",
        "category": "HLS Gateway",
        "description": "VidHide adaptive m3u8 resolver",
    },
}


def http_req(url, timeout=10, headers=None, method="GET", data=None):
    """Simple standard library HTTP requester with timing."""
    req_headers = {
        "User-Agent": "XiLustStatusBot/1.0 (CleanStream-Monitor)",
        "Accept": "*/*",
    }
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers, method=method, data=data)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            elapsed_ms = int((time.time() - t0) * 1000)
            body = resp.read()
            return {
                "ok": True,
                "status": resp.status,
                "elapsed_ms": elapsed_ms,
                "body": body,
                "headers": dict(resp.headers),
            }
    except urllib.error.HTTPError as e:
        elapsed_ms = int((time.time() - t0) * 1000)
        return {
            "ok": False,
            "status": e.code,
            "elapsed_ms": elapsed_ms,
            "error": f"HTTP {e.code}: {e.reason}",
            "body": e.read() if hasattr(e, "read") else b"",
        }
    except Exception as e:
        elapsed_ms = int((time.time() - t0) * 1000)
        return {"ok": False, "status": 0, "elapsed_ms": elapsed_ms, "error": str(e)}


def check_infrastructure():
    """Verify core servers and tunnels."""
    results = {}

    # 1. CleanStream Main Service
    cs_res = http_req(f"{CLEANSTREAM_URL}/", timeout=8)
    cs_active = cs_res["ok"] and cs_res["status"] == 200 and b"CleanStream" in cs_res.get("body", b"")
    results["CleanStream"] = {
        "name": "CleanStream Service",
        "url": CLEANSTREAM_URL,
        "active": cs_active,
        "status_code": cs_res.get("status"),
        "latency_ms": cs_res["elapsed_ms"],
        "error": None if cs_active else cs_res.get("error", "Invalid response"),
    }

    # 2. CleanStream API Endpoint
    api_res = http_req(f"{CLEANSTREAM_URL}/api/resolve", timeout=8)
    api_active = api_res["ok"] or api_res["status"] == 400  # returns 400 if url missing, meaning API is up!
    results["CleanStream_API"] = {
        "name": "CleanStream API (/api/resolve)",
        "url": f"{CLEANSTREAM_URL}/api/resolve",
        "active": api_active,
        "status_code": api_res.get("status"),
        "latency_ms": api_res["elapsed_ms"],
        "error": None if api_active else api_res.get("error"),
    }

    # 3. Catalog API
    cat_res = http_req(f"{CATALOG_API_URL}/api/catalog?limit=1", timeout=8)
    cat_active = cat_res["ok"] and cat_res["status"] == 200
    results["Catalog_API"] = {
        "name": "VPS Catalog API (SQLite)",
        "url": CATALOG_API_URL,
        "active": cat_active,
        "status_code": cat_res.get("status"),
        "latency_ms": cat_res["elapsed_ms"],
        "error": None if cat_active else cat_res.get("error"),
    }

    return results


def check_stream_server(host_key, sample_info):
    """Test a streaming host through CleanStream's resolver."""
    url = sample_info["url"]
    resolve_endpoint = f"{CLEANSTREAM_URL}/api/resolve?url={urllib.parse.quote(url)}"
    res = http_req(resolve_endpoint, timeout=12)

    if not res["ok"]:
        return {
            "name": sample_info["label"],
            "category": sample_info["category"],
            "cleanstream_working": False,
            "status": "OFFLINE",
            "latency_ms": res["elapsed_ms"],
            "error": res.get("error", "HTTP request failed"),
            "details": None,
        }

    try:
        data = json.loads(res["body"].decode("utf-8"))
        success = data.get("success", False)
        stream_url = data.get("stream_url")
        proxy_url = data.get("proxy_url")
        sandbox_embed = data.get("sandbox_embed_url")

        if success and (stream_url or proxy_url or sandbox_embed):
            # Test proxy stream if available (probe first 1KB)
            probe_ok = True
            if proxy_url:
                full_proxy = urllib.parse.urljoin(CLEANSTREAM_URL, proxy_url)
                probe_res = http_req(full_proxy, timeout=8, headers={"Range": "bytes=0-1024"})
                probe_ok = probe_res["ok"] and probe_res["status"] in (200, 206)

            return {
                "name": sample_info["label"],
                "category": sample_info["category"],
                "cleanstream_working": True,
                "status": "ONLINE" if probe_ok else "DEGRADED",
                "latency_ms": res["elapsed_ms"],
                "stream_found": bool(stream_url or proxy_url),
                "is_hls": data.get("is_hls", False),
                "has_proxy": bool(proxy_url),
                "probe_ok": probe_ok,
                "title": data.get("title", ""),
                "error": None,
            }
        else:
            return {
                "name": sample_info["label"],
                "category": sample_info["category"],
                "cleanstream_working": False,
                "status": "DOWN",
                "latency_ms": res["elapsed_ms"],
                "error": data.get("error", "Resolver returned success=false"),
            }
    except Exception as e:
        return {
            "name": sample_info["label"],
            "category": sample_info["category"],
            "cleanstream_working": False,
            "status": "ERROR",
            "latency_ms": res["elapsed_ms"],
            "error": f"JSON parse error: {e}",
        }


def run_full_diagnostic():
    """Run diagnostics on infrastructure and all streaming servers."""
    start_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    infra = check_infrastructure()

    server_results = {}
    for key, info in SAMPLE_HOSTS.items():
        server_results[key] = check_stream_server(key, info)

    active_servers = sum(1 for s in server_results.values() if s.get("cleanstream_working"))
    total_servers = len(server_results)

    return {
        "timestamp": start_time,
        "cleanstream_url": CLEANSTREAM_URL,
        "catalog_api_url": CATALOG_API_URL,
        "infrastructure": infra,
        "servers": server_results,
        "summary": {
            "active_servers": active_servers,
            "total_servers": total_servers,
            "health_percent": round((active_servers / total_servers) * 100, 1) if total_servers else 0,
            "cleanstream_healthy": infra.get("CleanStream", {}).get("active", False),
            "catalog_healthy": infra.get("Catalog_API", {}).get("active", False),
        },
    }


def format_cli_output(diag):
    """Format diagnostic data into an ANSI terminal dashboard."""
    lines = []
    lines.append("================================================================================")
    lines.append(f"  XiLust CleanStream & Server Health Monitor — {diag['timestamp']}")
    lines.append("================================================================================")
    lines.append("")
    lines.append("  [ INFRASTRUCTURE & TUNNELS ]")
    for k, inf in diag["infrastructure"].items():
        icon = "\033[92m[ACTIVE]\033[0m" if inf["active"] else "\033[91m[DOWN]\033[0m"
        latency = f"{inf['latency_ms']}ms"
        lines.append(f"    {icon:<18} {inf['name']:<30} {latency:<8} {inf['url']}")

    lines.append("")
    lines.append("  [ VIDEO STREAMING SERVERS (CLEANSTREAM AD-FREE) ]")
    lines.append(f"    {'Status':<16} {'Server':<22} {'Category':<18} {'Latency':<9} {'Notes'}")
    lines.append("    " + "-" * 72)

    for k, srv in diag["servers"].items():
        if srv["cleanstream_working"]:
            if srv["status"] == "ONLINE":
                badge = "\033[92m[ONLINE]\033[0m"
            else:
                badge = "\033[93m[DEGRADED]\033[0m"
        else:
            badge = "\033[91m[OFFLINE]\033[0m"

        note = "CleanStream Protected" if srv["cleanstream_working"] else (srv.get("error") or "Failed")
        if srv.get("has_proxy"):
            note += " (Proxy Active)"
        lat = f"{srv['latency_ms']}ms"

        lines.append(f"    {badge:<24} {srv['name']:<22} {srv['category']:<18} {lat:<9} {note}")

    lines.append("")
    summ = diag["summary"]
    status_color = "\033[92m" if summ["health_percent"] >= 75 else "\033[93m"
    lines.append(
        f"  Overall Score: {status_color}{summ['active_servers']}/{summ['total_servers']} Servers Operational "
        f"({summ['health_percent']}%)\033[0m"
    )
    lines.append("================================================================================")
    return "\n".join(lines)


def format_telegram_message(diag):
    """Format diagnostic data into Telegram Markdown format."""
    summ = diag["summary"]
    cs_icon = "🟢" if summ["cleanstream_healthy"] else "🔴"
    cat_icon = "🟢" if summ["catalog_healthy"] else "🔴"

    msg = [
        "🛡️ *XiLust CleanStream & Server Monitor*",
        f"⏱ _Updated: {diag['timestamp']}_",
        "",
        "*Infrastructure:*",
        f"• {cs_icon} CleanStream Tunnel: `{diag['infrastructure']['CleanStream']['latency_ms']}ms`",
        f"• {cat_icon} Catalog API Mirror: `{diag['infrastructure']['Catalog_API']['latency_ms']}ms`",
        "",
        "*Streaming Servers (CleanStream Protected):*",
    ]

    for k, srv in diag["servers"].items():
        if srv["cleanstream_working"]:
            icon = "🟢" if srv["status"] == "ONLINE" else "🟡"
            proxy_badge = " [VPS Proxy]" if srv.get("has_proxy") else ""
            msg.append(f"• {icon} *{srv['name']}*: `{srv['latency_ms']}ms`{proxy_badge}")
        else:
            err = srv.get("error") or "Unreachable"
            msg.append(f"• 🔴 *{srv['name']}*: `FAILED` _({err[:30]})_")

    msg.append("")
    health_bar = "🟩" * int(summ["health_percent"] / 10) + "⬜" * (10 - int(summ["health_percent"] / 10))
    msg.append(f"*Health Score:* {health_bar} *{summ['health_percent']}%*")
    msg.append(f"_{summ['active_servers']} of {summ['total_servers']} servers operational ad-free._")
    return "\n".join(msg)


# ---------------------------------------------------------------- Telegram Poller
def run_telegram_bot(bot_token: str):
    """Run standalone Telegram bot daemon using native urllib API."""
    print(f"[*] Starting XiLust CleanStream Status Bot on Telegram...")
    base_api = f"https://api.telegram.org/bot{bot_token}"

    # Get bot info
    info_res = http_req(f"{base_api}/getMe")
    if not info_res["ok"]:
        print(f"[!] Error connecting to Telegram API: {info_res.get('error')}")
        return
    bot_user = json.loads(info_res["body"].decode("utf-8")).get("result", {}).get("username", "bot")
    print(f"[✓] Bot logged in as @{bot_user}. Listening for commands (/status, /servers, /test, /ping)...")

    offset = 0
    while True:
        try:
            poll_url = f"{base_api}/getUpdates?offset={offset}&timeout=20"
            res = http_req(poll_url, timeout=30)
            if not res["ok"]:
                time.sleep(3)
                continue

            data = json.loads(res["body"].decode("utf-8"))
            for update in data.get("result", []):
                offset = update["update_id"] + 1
                msg = update.get("message")
                if not msg or "text" not in msg:
                    continue

                chat_id = msg["chat"]["id"]
                text = msg["text"].strip()
                cmd = text.split()[0].lower() if text else ""

                if cmd in ("/start", "/help"):
                    reply = (
                        "👋 *Welcome to XiLust CleanStream Status Bot*\n\n"
                        "Available Commands:\n"
                        "• `/status` - Live health check for all streaming servers & CleanStream\n"
                        "• `/servers` - List supported ad-free mirrors and status\n"
                        "• `/test <url>` - Test any specific stream link through CleanStream\n"
                        "• `/ping` - Fast ping check of VPS nodes\n"
                    )
                    send_tg(base_api, chat_id, reply)

                elif cmd in ("/status", "/cleanstream"):
                    send_tg(base_api, chat_id, "🔍 *Probing CleanStream & streaming servers... please wait...*")
                    diag = run_full_diagnostic()
                    reply = format_telegram_message(diag)
                    send_tg(base_api, chat_id, reply)

                elif cmd == "/ping":
                    t0 = time.time()
                    inf = check_infrastructure()
                    ms = int((time.time() - t0) * 1000)
                    cs_ok = "🟢" if inf["CleanStream"]["active"] else "🔴"
                    cat_ok = "🟢" if inf["Catalog_API"]["active"] else "🔴"
                    send_tg(
                        base_api,
                        chat_id,
                        f"🏓 *Pong!* (`{ms}ms`)\n\n"
                        f"{cs_ok} CleanStream VPS: `{inf['CleanStream']['latency_ms']}ms`\n"
                        f"{cat_ok} Catalog API VPS: `{inf['Catalog_API']['latency_ms']}ms`",
                    )

                elif cmd == "/servers":
                    diag = run_full_diagnostic()
                    lines = ["🖥️ *Supported CleanStream Video Servers:*", ""]
                    for k, s in diag["servers"].items():
                        status_str = "🟢 Active" if s["cleanstream_working"] else "🔴 Down"
                        lines.append(f"• *{s['name']}* ({s['category']}) — {status_str}")
                    send_tg(base_api, chat_id, "\n".join(lines))

                elif cmd.startswith("/test"):
                    parts = text.split(maxsplit=1)
                    if len(parts) < 2:
                        send_tg(base_api, chat_id, "⚠️ Usage: `/test <video_url>`")
                    else:
                        target_url = parts[1].strip()
                        send_tg(base_api, chat_id, f"🧪 *Testing link on CleanStream:* `{target_url[:60]}`...")
                        res = check_stream_server("custom", {"label": "Custom URL", "url": target_url, "category": "Test"})
                        if res["cleanstream_working"]:
                            send_tg(
                                base_api,
                                chat_id,
                                f"✅ *CleanStream Success!*\n\n"
                                f"• Server: *{res['name']}*\n"
                                f"• Latency: `{res['latency_ms']}ms`\n"
                                f"• Stream Ready: `{'Yes' if res.get('stream_found') else 'No'}`\n"
                                f"• VPS Proxy: `{'Active' if res.get('has_proxy') else 'Direct'}`\n"
                                f"• Title: _{res.get('title') or 'N/A'}_",
                            )
                        else:
                            send_tg(
                                base_api,
                                chat_id,
                                f"❌ *CleanStream Failed to Resolve*\n\n"
                                f"• Error: `{res.get('error', 'Unknown')}`\n"
                                f"• Latency: `{res['latency_ms']}ms`",
                            )

        except Exception as e:
            print(f"[!] Polling exception: {e}")
            time.sleep(2)


def send_tg(base_api, chat_id, text):
    """Send markdown message to Telegram."""
    try:
        payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}).encode("utf-8")
        req = urllib.request.Request(
            f"{base_api}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"[!] Failed to send Telegram message: {e}")


# ---------------------------------------------------------------- Main Entrypoint
def main():
    parser = argparse.ArgumentParser(description="CleanStream & Video Server Health Monitor")
    parser.add_argument("--json", action="store_true", help="Output raw JSON data")
    parser.add_argument("--telegram", action="store_true", help="Run as Telegram bot daemon")
    parser.add_argument("--token", type=str, help="Telegram bot token")
    parser.add_argument("--monitor", action="store_true", help="Run continuous monitoring loop")
    parser.add_argument("--interval", type=int, default=300, help="Monitor interval in seconds (default: 300)")
    args = parser.parse_args()

    if args.telegram:
        token = args.token or os.environ.get("TELEGRAM_BOT_TOKEN") or os.environ.get("BOT_TOKEN")
        if not token:
            print("ERROR: Please provide a Telegram Bot Token via --token or TELEGRAM_BOT_TOKEN environment variable.")
            sys.exit(1)
        run_telegram_bot(token)
        return

    if args.monitor:
        print(f"[*] Starting CleanStream Monitor (Interval: {args.interval}s)...")
        while True:
            diag = run_full_diagnostic()
            if args.json:
                print(json.dumps(diag, indent=2))
            else:
                print(format_cli_output(diag))
            time.sleep(args.interval)
        return

    # One-shot check
    diag = run_full_diagnostic()
    if args.json:
        print(json.dumps(diag, indent=2))
    else:
        print(format_cli_output(diag))


if __name__ == "__main__":
    main()
