from __future__ import annotations

import contextlib
import http.server
import socketserver
import threading
import urllib.parse
from pathlib import Path

import pytest
from test.common import LANGUAGES, PROJECT_ROOT, STATIC_TMP_ROOT


class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return

    def send_head(self):  # noqa: D401
        path = self.translate_path(self.path)
        if Path(path).is_dir():
            for candidate in ("index.html",):
                index_path = Path(path) / candidate
                if index_path.exists():
                    self.path = urllib.parse.urljoin(self.path.rstrip("/") + "/", candidate)
                    return super().send_head()

        if not Path(path).exists():
            parsed = urllib.parse.urlsplit(self.path)
            request_path = parsed.path
            if "." not in Path(request_path).name:
                for candidate in (f"{request_path}.html", f"{request_path}/index.html"):
                    candidate_fs = Path(self.translate_path(candidate))
                    if candidate_fs.exists():
                        self.path = urllib.parse.urlunsplit(
                            (parsed.scheme, parsed.netloc, candidate, parsed.query, parsed.fragment)
                        )
                        return super().send_head()

        return super().send_head()


@pytest.fixture(scope="session")
def site_root() -> Path:
    if not STATIC_TMP_ROOT.exists():
        pytest.skip("static-tmp is missing; build the site before running tests.")

    missing = [lang for lang in LANGUAGES if not (STATIC_TMP_ROOT / lang / "index.html").exists()]
    if missing:
        pytest.skip(f"Localized build output missing for languages: {', '.join(missing)}")

    return STATIC_TMP_ROOT


@pytest.fixture(scope="session")
def base_url(site_root: Path) -> str:
    class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        allow_reuse_address = True

    handler = lambda *args, **kwargs: QuietHTTPRequestHandler(  # noqa: E731
        *args,
        directory=str(site_root),
        **kwargs,
    )

    server = ThreadedTCPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    host, port = server.server_address
    try:
        yield f"http://{host}:{port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


@pytest.fixture(scope="session")
def playwright_browser():
    playwright = pytest.importorskip("playwright.sync_api")
    with playwright.sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        try:
            yield browser
        finally:
            browser.close()


@pytest.fixture()
def page(playwright_browser):
    context = playwright_browser.new_context()
    context.add_init_script(
        """
        (() => {
            const usbMock = {
                async requestDevice() {
                    throw new DOMException("No device selected.", "NotFoundError");
                },
                addEventListener() {},
                removeEventListener() {},
                async getDevices() { return []; },
            };

            Object.defineProperty(navigator, "usb", {
                configurable: true,
                enumerable: true,
                value: usbMock,
            });

            Object.defineProperty(navigator, "wakeLock", {
                configurable: true,
                enumerable: true,
                value: {
                    async request() {
                        return {
                            released: false,
                            addEventListener() {},
                            release() {
                                return Promise.resolve();
                            },
                        };
                    },
                },
            });
        })();
        """
    )

    page = context.new_page()
    try:
        yield page
    finally:
        with contextlib.suppress(Exception):
            page.close()
        context.close()
