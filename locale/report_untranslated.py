#!/usr/bin/env python3
"""
Reports untranslated .po entries by language and source file.

By default, an entry is considered untranslated when:
- msgstr is empty, or
- any plural msgstr[n] is empty.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable


@dataclass
class PoEntry:
    msgid: str = ""
    msgid_plural: str | None = None
    msgstr: str = ""
    msgstr_plural: dict[int, str] = field(default_factory=dict)
    occurrences: list[tuple[str, int | None]] = field(default_factory=list)
    obsolete: bool = False

    @property
    def is_header(self) -> bool:
        return self.msgid == ""

    @property
    def is_untranslated(self) -> bool:
        if self.msgid_plural is not None:
            return not self.msgstr_plural or any(not value.strip() for value in self.msgstr_plural.values())
        return not self.msgstr.strip()


def _unquote_po_string(line: str) -> str:
    if not line.startswith('"'):
        return ""
    # .po quoted strings follow simple C-style escaping, so json handles them well.
    return json.loads(line)


def parse_po_file(path: Path) -> list[PoEntry]:
    text = path.read_text(encoding="utf-8")
    entries: list[PoEntry] = []

    current = PoEntry()
    active_field: tuple[str, int | None] | None = None

    def finalize() -> None:
        nonlocal current, active_field
        if current.msgid or current.msgstr or current.msgstr_plural or current.occurrences:
            entries.append(current)
        current = PoEntry()
        active_field = None

    for raw_line in text.splitlines():
        line = raw_line.rstrip("\n")

        if not line.strip():
            finalize()
            continue

        if line.startswith("#~"):
            current.obsolete = True
            continue

        if line.startswith("#:"):
            refs = line[2:].strip().split()
            for ref in refs:
                if ":" in ref:
                    file_path, _, line_no = ref.rpartition(":")
                    try:
                        current.occurrences.append((file_path, int(line_no)))
                    except ValueError:
                        current.occurrences.append((ref, None))
                else:
                    current.occurrences.append((ref, None))
            continue

        if line.startswith("msgid_plural "):
            current.msgid_plural = _unquote_po_string(line[len("msgid_plural "):])
            active_field = ("msgid_plural", None)
            continue

        if line.startswith("msgid "):
            current.msgid = _unquote_po_string(line[len("msgid "):])
            active_field = ("msgid", None)
            continue

        if line.startswith("msgstr["):
            index_end = line.index("]")
            index = int(line[len("msgstr["):index_end])
            current.msgstr_plural[index] = _unquote_po_string(line[index_end + 2:])
            active_field = ("msgstr_plural", index)
            continue

        if line.startswith("msgstr "):
            current.msgstr = _unquote_po_string(line[len("msgstr "):])
            active_field = ("msgstr", None)
            continue

        if line.startswith('"') and active_field is not None:
            chunk = _unquote_po_string(line)
            field_name, index = active_field
            if field_name == "msgid":
                current.msgid += chunk
            elif field_name == "msgid_plural":
                current.msgid_plural = (current.msgid_plural or "") + chunk
            elif field_name == "msgstr":
                current.msgstr += chunk
            elif field_name == "msgstr_plural" and index is not None:
                current.msgstr_plural[index] = current.msgstr_plural.get(index, "") + chunk

    finalize()
    return entries


def find_po_files(locale_root: Path) -> list[Path]:
    return sorted(locale_root.glob("*/LC_MESSAGES/*.po"))


def build_report(locale_root: Path, languages: set[str] | None = None) -> dict[str, dict]:
    report: dict[str, dict] = {}

    for po_file in find_po_files(locale_root):
        language = po_file.parts[-3]
        if languages is not None and language not in languages:
            continue
        entries = parse_po_file(po_file)

        untranslated = [
            entry for entry in entries
            if not entry.obsolete and not entry.is_header and entry.is_untranslated
        ]

        by_file: dict[str, list[PoEntry]] = defaultdict(list)
        for entry in untranslated:
            source_files = {occurrence[0] for occurrence in entry.occurrences} or {"<no occurrence>"}
            for source_file in source_files:
                by_file[source_file].append(entry)

        report[language] = {
            "po_file": str(po_file),
            "total_untranslated": len(untranslated),
            "files": {
                source_file: {
                    "count": len(file_entries),
                    "entries": [
                        {
                            "msgid": entry.msgid,
                            "occurrences": [f"{path}:{line}" if line is not None else path for path, line in entry.occurrences],
                        }
                        for entry in file_entries
                    ],
                }
                for source_file, file_entries in sorted(by_file.items())
            },
        }

    return report


def print_text_report(report: dict[str, dict], show_entries: bool, max_entries: int) -> None:
    if not report:
        print("No .po files found.")
        return

    for language, language_data in sorted(report.items()):
        print(f"[{language}]")
        print(f"po: {language_data['po_file']}")
        print(f"untranslated entries: {language_data['total_untranslated']}")

        files = language_data["files"]
        if not files:
            print("  all entries translated")
            print()
            continue

        for source_file, file_data in files.items():
            print(f"  - {source_file}: {file_data['count']}")
            if show_entries:
                for entry in file_data["entries"][:max_entries]:
                    print(f"      * {entry['msgid']}")
        print()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Report untranslated .po entries by language and source file."
    )
    parser.add_argument(
        "--locale-root",
        default=Path(__file__).resolve().parent,
        type=Path,
        help="Path to the locale directory. Defaults to the script directory.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print the report as JSON.",
    )
    parser.add_argument(
        "--language",
        action="append",
        dest="languages",
        help="Limit the report to one or more languages, e.g. --language ru --language de.",
    )
    parser.add_argument(
        "--show-entries",
        action="store_true",
        help="Include msgid examples in the text report.",
    )
    parser.add_argument(
        "--max-entries",
        type=int,
        default=10,
        help="Maximum number of msgid examples to print per file when --show-entries is used.",
    )
    args = parser.parse_args()

    selected_languages = set(args.languages) if args.languages else None
    report = build_report(args.locale_root, selected_languages)
    if args.json:
        sys.stdout.write(json.dumps(report, ensure_ascii=True, indent=2) + "\n")
    else:
        print_text_report(report, args.show_entries, args.max_entries)


if __name__ == "__main__":
    main()