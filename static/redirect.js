// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

"use strict";

// Client-side redirects for fragments (anchors)
//
// It should be possible to do this with server-side redirects, but it was never implemented or
// standardized. For reference:
//
// https://www.w3.org/People/Bos/redirect
// https://www.w3.org/Protocols/HTTP/Fragment/draft-bos-http-redirect-00.txt

const redirects = new Map([
    ["/#device-support", "/faq#device-support"],
]);

function handle_hash() {
    if (window.location.hash) {
        const redirect = redirects.get(window.location.pathname + window.location.hash);
        if (redirect) {
            window.location.replace(redirect);
        }
    }
}

handle_hash();
addEventListener("hashchange", handle_hash, false);

// @license-end
