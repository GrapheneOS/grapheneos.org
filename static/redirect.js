// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

"use strict";

// Client-side redirects for fragments (anchors)
//
// It should be possible to do this with server-side redirects, but it was never implemented or
// standardized. For reference:
//
// https://www.w3.org/People/Bos/redirect
// https://www.w3.org/Protocols/HTTP/Fragment/draft-bos-http-redirect-00.txt

function handle_hash() {
    if (window.location.hash === "#device-support") {
        window.location.replace("https://grapheneos.org/faq#device-support");
    }
}

handle_hash();
addEventListener("hashchange", handle_hash, false);

// @license-end
