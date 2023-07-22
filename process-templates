#!/usr/bin/env python3

from jinja2 import FileSystemLoader, Environment
import os
import sys

ROOT_DIR = sys.argv[1]
TEMPLATE_PATH_LIST = [ROOT_DIR, "templates/"]

loader = FileSystemLoader(searchpath=TEMPLATE_PATH_LIST)
environment = Environment(loader=loader, autoescape=True)

template_file_list = []
for dirpath, dirnames, filenames in os.walk(ROOT_DIR):
    for filename in filenames:
        if filename.endswith(".html"):
            template_file_list.append(
                (os.path.join(dirpath, filename)).split(sep=os.path.sep, maxsplit=1)[1]
            )

for template_file in template_file_list:
    template = environment.get_template(template_file)
    rendered_template = template.render()
    path = os.path.join(ROOT_DIR, template_file)
    with open(path, mode="w") as f:
        f.write(rendered_template)
