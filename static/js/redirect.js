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

    ["/faq#dns", "/faq#custom-dns"],
    ["/faq#when-devices", "/faq#future-devices"],


    ["/features#usb-c-port-control", "/features#usb-c-port-and-pogo-pins-control"],

    ["/hiring#qualitifations", "/hiring#qualifications"],

    ["/install/cli#fastboot-as-non-root", "/install/cli#flashing-as-non-root"],
    ["/install/cli#obtaining-signify", "/install/cli#obtaining-openssh"],
    ["/install/web#fastboot-as-non-root", "/install/web#flashing-as-non-root"],

    ["/build#enabling-updatable-apex-components", "/build#apex-components"],

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

    ["/releases#stable-channel", "/releases#devices"]
    ["/releases#beta-channel", "/releases#devices"]

    ["/releases#comet-stable", "/releases#comet"]
    ["/releases#comet-beta", "/releases#comet"]
    ["/releases#komodo-stable", "/releases#komodo"]
    ["/releases#komodo-beta", "/releases#komodo"]
    ["/releases#caiman-stable", "/releases#caiman"]
    ["/releases#caiman-beta", "/releases#caiman"]
    ["/releases#tokay-stable", "/releases#tokay"]
    ["/releases#tokay-beta", "/releases#tokay"]
    ["/releases#akita-stable", "/releases#akita"]
    ["/releases#akita-beta", "/releases#akita"]
    ["/releases#husky-stable", "/releases#husky"]
    ["/releases#husky-beta", "/releases#husky"]
    ["/releases#shiba-stable", "/releases#shiba"]
    ["/releases#shiba-beta", "/releases#shiba"]
    ["/releases#felix-stable", "/releases#felix"]
    ["/releases#felix-beta", "/releases#felix"]
    ["/releases#tangorpro-stable", "/releases#tangorpro"]
    ["/releases#tangorpro-beta", "/releases#tangorpro"]
    ["/releases#lynx-stable", "/releases#lynx"]
    ["/releases#lynx-beta", "/releases#lynx"]
    ["/releases#cheetah-stable", "/releases#cheetah"]
    ["/releases#cheetah-beta", "/releases#cheetah"]
    ["/releases#panther-stable", "/releases#panther"]
    ["/releases#panther-beta", "/releases#panther"]
    ["/releases#bluejay-stable", "/releases#bluejay"]
    ["/releases#bluejay-beta", "/releases#bluejay"]
    ["/releases#raven-stable", "/releases#raven"]
    ["/releases#raven-beta", "/releases#raven"]
    ["/releases#oriole-stable", "/releases#oriole"]
    ["/releases#oriole-beta", "/releases#oriole"]
    ["/releases#barbet-stable", "/releases#barbet"]
    ["/releases#barbet-beta", "/releases#barbet"]
    ["/releases#redfin-stable", "/releases#redfin"]
    ["/releases#redfin-beta", "/releases#redfin"]
    ["/releases#bramble-stable", "/releases#bramble"]
    ["/releases#bramble-beta", "/releases#bramble"]
    ["/releases#sunfish-stable", "/releases#sunfish"]
    ["/releases#sunfish-beta", "/releases#sunfish"]
    ["/releases#coral-stable", "/releases#coral"]
    ["/releases#coral-beta", "/releases#coral"]
    ["/releases#flame-stable", "/releases#flame"]
    ["/releases#flame-beta", "/releases#flame"]

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
