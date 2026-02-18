// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

// Client-side redirects for fragments (anchors)
//
// It should be possible to do this with either HTML or server-side redirects, but it was never
// implemented or standardized. For reference:
//
// https://www.w3.org/People/Bos/redirect
// https://www.w3.org/Protocols/HTTP/Fragment/draft-bos-http-redirect-00.txt

const redirects = new Map([
    // removed main page sections
    ["/#copyright-and-licensing", "/faq#copyright-and-licensing"],
    ["/#history", "/history"],
    ["/#roadmap", "/faq#roadmap"],
    ["/#upstream", "/faq#upstream"],

    ["/usage#default-connections", "/faq#default-connections"],
    ["/usage#sandboxed-google-play-esim", "/usage#esim-support"],
    ["/usage#sandboxed-play-services", "/usage#sandboxed-google-play"],
    ["/usage#sandboxed-play-services-installation", "/usage#sandboxed-google-play-installation"],
    ["/usage#sandboxed-play-services-limitations", "/usage#sandboxed-google-play-limitations"],
    ["/usage#google-camera", "/usage#pixel-camera"],
    ["/usage#usb-peripherals", "/usage#usb-c-port-and-pogo-pins-control"],
    ["/usage#esim-management", "/usage#esim-support"],

    ["/faq#dns", "/faq#custom-dns"],
    ["/faq#when-devices", "/faq#future-devices"],

    ["/features#usb-c-port-control", "/features#usb-c-port-and-pogo-pins-control"],
    ["/features#Two-factor-fingerprint-unlock", "/features#two-factor-fingerprint-unlock"],

    ["/hiring#qualitifations", "/hiring#qualifications"],

    ["/install/cli#fastboot-as-non-root", "/install/cli#flashing-as-non-root"],
    ["/install/cli#obtaining-signify", "/install/cli#obtaining-openssh"],
    ["/install/web#fastboot-as-non-root", "/install/web#flashing-as-non-root"],

    ["/install/cli#working-around-fwupd-bug-on-linux-distributions", "/install/cli#working-around-fwupd-bugs-on-linux-distributions"],
    ["/install/web#working-around-fwupd-bug-on-linux-distributions", "/install/web#working-around-fwupd-bugs-on-linux-distributions"],

    ["/build#enabling-updatable-apex-components", "/build#apex-components"],
    ["/build#kernel-6th-generation-pixels", "/build#kernel-6th-through-9th-generation-pixels"],
    ["/build#kernel-7th-generation-pixels", "/build#kernel-6th-through-9th-generation-pixels"],
    ["/build#kernel-6th-and-7th-generation-pixels", "/build#kernel-6th-through-9th-generation-pixels"],
    ["/build#kernel-8th-generation-pixels", "/build#kernel-6th-through-9th-generation-pixels"],
    ["/build#kernel-9th-generation-pixels", "/build#kernel-6th-through-9th-generation-pixels"],

    // legacy devices
    ["/releases#marlin-stable", "/faq#legacy-devices"],
    ["/releases#marlin-beta", "/faq#legacy-devices"],
    ["/releases#sailfish-stable", "/faq#legacy-devices"],
    ["/releases#sailfish-beta", "/faq#legacy-devices"],
    ["/releases#taimen-stable", "/faq#legacy-devices"],
    ["/releases#taimen-beta", "/faq#legacy-devices"],
    ["/releases#walleye-stable", "/faq#legacy-devices"],
    ["/releases#walleye-beta", "/faq#legacy-devices"],
    ["/releases#bonito-stable", "/faq#legacy-devices"],
    ["/releases#bonito-beta", "/faq#legacy-devices"],
    ["/releases#sargo-stable", "/faq#legacy-devices"],
    ["/releases#sargo-beta", "/faq#legacy-devices"],
    ["/releases#crosshatch-stable", "/faq#legacy-devices"],
    ["/releases#crosshatch-beta", "/faq#legacy-devices"],
    ["/releases#blueline-stable", "/faq#legacy-devices"],
    ["/releases#blueline-beta", "/faq#legacy-devices"],

    // legacy servers
    ["/articles/grapheneos-servers#apps.grapheneos.org", "/articles/grapheneos-servers#releases.grapheneos.org"],
    ["/articles/grapheneos-servers#time.grapheneos.org", "/articles/grapheneos-servers#grapheneos.network"],
    ["/articles/grapheneos-servers#grapheneos.network", "/articles/grapheneos-servers#grapheneos.org"],

    // preserve links to CLI install guide from when it was /install
    ["/install/#prerequisites", "/install/cli#prerequisites"],
    ["/install/#enabling-oem-unlocking", "/install/cli#enabling-oem-unlocking"],
    ["/install/#opening-terminal", "/install/cli#opening-terminal"],
    ["/install/#obtaining-fastboot", "/install/cli#obtaining-fastboot"],
    ["/install/#standalone-platform-tools", "/install/cli#standalone-platform-tools"],
    ["/install/#checking-fastboot-version", "/install/cli#checking-fastboot-version"],
    ["/install/#fastboot-as-non-root", "/install/cli#flashing-as-non-root"],
    ["/install/#connecting-phone", "/install/cli#connecting-phone"],
    ["/install/#unlocking-the-bootloader", "/install/cli#unlocking-the-bootloader"],
    ["/install/#obtaining-signify", "/install/cli#obtaining-openssh"],
    ["/install/#obtaining-factory-images", "/install/cli#obtaining-factory-images"],
    ["/install/#flashing-factory-images", "/install/cli#flashing-factory-images"],
    ["/install/#troubleshooting", "/install/cli#troubleshooting"],
    ["/install/#locking-the-bootloader", "/install/cli#locking-the-bootloader"],
    ["/install/#post-installation", "/install/cli#post-installation"],
    ["/install/#booting", "/install/cli#booting"],
    ["/install/#disabling-oem-unlocking", "/install/cli#disabling-oem-unlocking"],
    ["/install/#replacing-grapheneos-with-the-stock-os", "/install/cli#replacing-grapheneos-with-the-stock-os"],
    ["/install/#further-information", "/install/cli#further-information"],
    ["/install/web#connecting-phone", "/install/web#connecting-device"],
    ["/install/cli#connecting-phone", "/install/cli#connecting-device"],
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
