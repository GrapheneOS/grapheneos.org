// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

// Client-side redirects for fragments (anchors)
//
// It should be possible to do this with either HTML or server-side redirects, but it was never
// implemented or standardized. For reference:
//
// https://www.w3.org/People/Bos/redirect
// https://www.w3.org/Protocols/HTTP/Fragment/draft-bos-http-redirect-00.txt

const redirects = new Map([
    ["/#copyright-and-licensing", "/faq#copyright-and-licensing"],
    ["/usage#default-connections", "/faq#default-connections"],
    ["/faq#dns", "/faq#custom-dns"],
    ["/install/cli#fastboot-as-non-root", "/install/cli#flashing-as-non-root"],
    ["/install/web#fastboot-as-non-root", "/install/web#flashing-as-non-root"],

    // legacy devices
    ["/releases#marlin-stable", "/faq#legacy-devices"],
    ["/releases#marlin-beta", "/faq#legacy-devices"],
    ["/releases#sailfish-stable", "/faq#legacy-devices"],
    ["/releases#sailfish-beta", "/faq#legacy-devices"],
    ["/releases#taimen-stable", "/faq#legacy-devices"],
    ["/releases#taimen-beta", "/faq#legacy-devices"],
    ["/releases#walleye-stable", "/faq#legacy-devices"],
    ["/releases#walleye-beta", "/faq#legacy-devices"],

    // legacy servers
    ["/articles/grapheneos-servers#apps.grapheneos.org", "/articles/grapheneos-servers#releases.grapheneos.org"],
    ["/articles/grapheneos-servers#time.grapheneos.org", "/articles/grapheneos-servers#grapheneos.network"],

    // preserve links to CLI install guide from when it was /install
    ["/install/#prerequisites", "/install/cli#prerequisites"],
    ["/install/#enabling-oem-unlocking", "/install/cli#enabling-oem-unlocking"],
    ["/install/#opening-terminal", "/install/cli#opening-terminal"],
    ["/install/#obtaining-fastboot", "/install/cli#obtaining-fastboot"],
    ["/install/#standalone-platform-tools", "/install/cli#standalone-platform-tools"],
    ["/install/#checking-fastboot-version", "/install/cli#checking-fastboot-version"],
    ["/install/#fastboot-as-non-root", "/install/cli#fastboot-as-non-root"],
    ["/install/#connecting-phone", "/install/cli#connecting-phone"],
    ["/install/#unlocking-the-bootloader", "/install/cli#unlocking-the-bootloader"],
    ["/install/#obtaining-signify", "/install/cli#obtaining-signify"],
    ["/install/#obtaining-factory-images", "/install/cli#obtaining-factory-images"],
    ["/install/#flashing-factory-images", "/install/cli#flashing-as-non-root"],
    ["/install/#troubleshooting", "/install/cli#troubleshooting"],
    ["/install/#locking-the-bootloader", "/install/cli#locking-the-bootloader"],
    ["/install/#post-installation", "/install/cli#post-installation"],
    ["/install/#booting", "/install/cli#booting"],
    ["/install/#disabling-oem-unlocking", "/install/cli#disabling-oem-unlocking"],
    ["/install/#replacing-grapheneos-with-the-stock-os", "/install/cli#replacing-grapheneos-with-the-stock-os"],
    ["/install/#further-information", "/install/cli#further-information"],
]);

function handleHash() {
    if (window.location.hash) {
        const redirect = redirects.get(window.location.pathname + window.location.hash);
        if (redirect) {
            window.location.replace(redirect);
        }
    }
}

handleHash();
addEventListener("hashchange", handleHash, false);

// @license-end
