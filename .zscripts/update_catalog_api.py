with open('/home/ubuntu/catalog_api.py', 'r') as f:
    content = f.read()

old_logic = """            where = ["section = ?"]
            params = [section]"""

new_logic = """            where = ["section = ?", "slug != 'live'"]
            params = [section]"""

content = content.replace(old_logic, new_logic)

old_order = """            tab = query.get("tab", ["new"])[0]
            order_by = "ORDER BY year DESC, published_at DESC, id DESC"
            if tab == "top":
                order_by = "ORDER BY views DESC, id DESC"
            elif tab == "new":
                order_by = "ORDER BY id DESC"
            elif tab == "random":
                order_by = "ORDER BY RANDOM()" """

# Try both formatted variations of old_order
if 'elif tab == "new":' in content:
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if 'tab = query.get("tab"' in line:
            new_lines.append('            tab = query.get("tab", ["new"])[0]')
            new_lines.append('            sort = query.get("sort", [""])[0]')
            new_lines.append("            order_by = \"ORDER BY COALESCE(year, 0) DESC, COALESCE(published_at, '') DESC, id DESC\"")
            new_lines.append('            if tab == "top" or sort in ("popular", "views"):')
            new_lines.append('                order_by = "ORDER BY COALESCE(views, 0) DESC, COALESCE(year, 0) DESC, id DESC"')
            new_lines.append('            elif tab == "new" or sort == "newest":')
            new_lines.append("                order_by = \"ORDER BY COALESCE(year, 0) DESC, COALESCE(published_at, '') DESC, id DESC\"")
            new_lines.append('            elif tab == "random":')
            new_lines.append('                order_by = "ORDER BY RANDOM()"')
            # skip until past the old block
            while i < len(lines) and 'order_by = "ORDER BY RANDOM()"' not in lines[i]:
                i += 1
            i += 1
            continue
        elif 'where = ["section = ?"]' in line:
            new_lines.append('            where = ["section = ?", "slug != \'live\'"]')
            i += 1
            continue
        new_lines.append(line)
        i += 1
    content = '\n'.join(new_lines)

with open('/home/ubuntu/catalog_api.py', 'w') as f:
    f.write(content)
print("Updated catalog_api.py on VPS successfully!")
