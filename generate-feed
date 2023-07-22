#!/usr/bin/env python3

from datetime import datetime

import lxml.html
from lxml import etree

document = lxml.html.parse("static-tmp/releases.html").getroot()
releases = document.body.cssselect("#changelog article")

updated = None
entries = []

for release in releases:
    title = release.attrib["id"]
    try:
        time = datetime.strptime(title, "%Y%m%d%H").isoformat() + "Z"
    except ValueError:
        time = datetime.strptime(title, "%Y.%m.%d.%H").isoformat() + "Z"
    if updated is None:
        updated = time
    content = [etree.tostring(e).decode() for e in release.getchildren()[1:]]
    entries.append(f"""
    <entry>
        <id>https://grapheneos.org/releases#{title}</id>
        <link href="https://grapheneos.org/releases#{title}"/>
        <title>{title}</title>
        <updated>{time}</updated>
        <published>{time}</published>
        <content type="xhtml">
            <div xmlns="http://www.w3.org/1999/xhtml">
                {"".join(content)}
            </div>
        </content>
    </entry>""")

feed = f"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <id>https://grapheneos.org/releases#changelog</id>
    <link href="https://grapheneos.org/releases#changelog"/>
    <link rel="self" href="https://grapheneos.org/releases.atom"/>
    <link rel="license" href="https://grapheneos.org/LICENSE.txt"/>
    <icon>https://grapheneos.org/favicon.ico</icon>
    <title>GrapheneOS changelog</title>
    <updated>{updated}</updated>
    <author>
        <name>GrapheneOS</name>
        <email>contact@grapheneos.org</email>
        <uri>https://grapheneos.org/</uri>
    </author>{"".join(entries)}
</feed>
"""

with open("static-tmp/releases.atom", "w") as f:
    f.write(feed)
