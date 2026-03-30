from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from test.common import LANGUAGES


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_report_module():
    module_path = PROJECT_ROOT / "locale" / "report_untranslated.py"
    spec = importlib.util.spec_from_file_location("report_untranslated", module_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_report_untranslated_detects_empty_and_plural_entries(tmp_path):
    module = load_report_module()

    po_file = tmp_path / "sample.po"
    po_file.write_text(
        '\n'.join(
            [
                '#: static/index.html:10',
                'msgid "Title"',
                'msgstr ""',
                '',
                '#: static/install/web.html:20',
                'msgid "Plural"',
                'msgid_plural "Plurals"',
                'msgstr[0] "Einzahl"',
                'msgstr[1] ""',
                '',
            ]
        ),
        encoding="utf-8",
    )

    entries = module.parse_po_file(po_file)
    untranslated = [entry.msgid for entry in entries if not entry.is_header and entry.is_untranslated]

    assert "Title" in untranslated
    assert "Plural" in untranslated


def test_report_untranslated_groups_entries_by_source_file(tmp_path):
    module = load_report_module()

    locale_root = tmp_path / "locale"
    po_file = locale_root / "xx" / "LC_MESSAGES" / "grapheneos.po"
    po_file.parent.mkdir(parents=True)
    po_file.write_text(
        '\n'.join(
            [
                '#: static/index.html:10',
                'msgid "Index string"',
                'msgstr ""',
                '',
                '#: templates/header.html:6',
                'msgid "Header string"',
                'msgstr ""',
                '',
            ]
        ),
        encoding="utf-8",
    )

    report = module.build_report(locale_root)

    assert report["xx"]["total_untranslated"] == 2
    assert report["xx"]["files"]["static/index.html"]["count"] == 1
    assert report["xx"]["files"]["templates/header.html"]["count"] == 1


def test_localized_build_output_exists_for_all_languages(site_root):
    for lang in LANGUAGES:
        assert (site_root / lang / "index.html").exists()
        assert (site_root / lang / "install" / "web.html").exists()


def test_localized_pages_have_language_attribute(site_root):
    for lang in LANGUAGES:
        index_html = (site_root / lang / "index.html").read_text(encoding="utf-8")
        assert f'<html lang="{lang}"' in index_html


def test_localized_pages_do_not_contain_unrendered_template_markers(site_root):
    paths = []
    for lang in LANGUAGES:
        paths.extend(
            [
                site_root / lang / "index.html",
                site_root / lang / "install" / "web.html",
            ]
        )

    for path in paths:
        html = path.read_text(encoding="utf-8")
        assert "{{" not in html
        assert "[[" not in html


def test_web_installer_pages_embed_i18n_payload(site_root):
    for lang in LANGUAGES:
        html = (site_root / lang / "install" / "web.html").read_text(encoding="utf-8")
        assert 'id="web-install-i18n"' in html
        assert '"errorPrefix"' in html
        assert '"webUsbUnavailable"' in html
