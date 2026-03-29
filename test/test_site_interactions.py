from __future__ import annotations

import pytest

from test.common import LANGUAGES


NAV_TARGETS = [
    ("/features", "features"),
    ("/install/", "install"),
    ("/build", "build"),
    ("/usage", "usage"),
    ("/faq", "faq"),
    ("/releases", "releases"),
    ("/source", "source"),
    ("/history/", "history"),
    ("/articles/", "articles"),
    ("/donate", "donate"),
    ("/contact", "contact"),
]

INSTALLER_BUTTONS = [
    ("unlock-bootloader", "unlock-bootloader-status"),
    ("download-release", "download-release-status"),
    ("flash-release", "flash-release-status"),
    ("lock-bootloader", "lock-bootloader-status"),
    ("remove-custom-key", "remove-custom-key-status"),
]


@pytest.mark.parametrize("lang", LANGUAGES)
def test_language_switcher_opens_and_marks_current_language(page, base_url, lang):
    page.goto(f"{base_url}/{lang}/", wait_until="networkidle")

    page.locator(".language-button").click()
    dropdown = page.locator(".language-dropdown")
    assert dropdown.is_visible()
    assert page.locator(f'.language-dropdown a[data-lang="{lang}"].active').count() == 1


@pytest.mark.parametrize("lang", LANGUAGES)
def test_language_switcher_navigates_to_same_page_in_another_language(page, base_url, lang):
    target_lang = next(candidate for candidate in LANGUAGES if candidate != lang)

    page.goto(f"{base_url}/{lang}/", wait_until="networkidle")
    page.locator(".language-button").click()
    page.locator(f'.language-dropdown a[data-lang="{target_lang}"]').click()

    page.wait_for_url(f"**/{target_lang}*")
    assert page.locator("html").get_attribute("lang") == target_lang


@pytest.mark.parametrize("lang", LANGUAGES)
@pytest.mark.parametrize(("target_suffix", "slug"), NAV_TARGETS)
def test_header_navigation_links_work_on_all_languages(page, base_url, lang, target_suffix, slug):
    page.goto(f"{base_url}/{lang}/", wait_until="networkidle")

    link = page.locator(f'#site-menu a[href="/{lang}{target_suffix}"]')
    assert link.count() == 1
    link.click()

    expected = f"/{lang}/{slug}" if slug not in {"install", "history", "articles"} else f"/{lang}/{slug}"
    page.wait_for_url(f"**{expected}**")
    assert page.locator("html").get_attribute("lang") == lang


@pytest.mark.parametrize("lang", LANGUAGES)
def test_web_installer_buttons_are_clickable_and_report_status(page, base_url, lang):
    page.goto(f"{base_url}/{lang}/install/web", wait_until="networkidle")

    for button_id, status_id in INSTALLER_BUTTONS:
        page.locator(f"#{button_id}-button").click()
        status = page.locator(f"#{status_id}")
        status.wait_for(state="visible")
        page.wait_for_function(
            """(id) => {
                const element = document.getElementById(id);
                return element && element.textContent.trim().length > 0;
            }""",
            status_id,
        )
        assert status.text_content().strip() != ""
