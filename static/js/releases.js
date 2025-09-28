// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

const baseUrl = "https://releases.grapheneos.org/";
const devices = ["tegu", "comet", "komodo", "caiman", "tokay", "akita", "husky", "shiba", "felix", "tangorpro", "lynx", "cheetah", "panther", "bluejay", "raven", "oriole", "barbet", "redfin", "bramble", "sunfish", "coral", "flame"];
const legacyFactoryDevices = new Set(["sunfish", "coral", "flame"]);
const channels = ["stable", "beta", "alpha"];
const delayMs = 1000 * 60 * 5;

async function updateReleases() {
    const requests = [];

    for (const channel of channels) {
        for (const device of devices) {
            requests.push(fetch(`${baseUrl}${device}-${channel}`).then(response => {
                if (!response.ok) {
                    return Promise.reject();
                }
                return response.text();
            }).then(text => {
                const metadata = text.trim().split(" ");

                const factoryFormat = legacyFactoryDevices.has(device) ? "factory" : "install";
                const factoryFilename = `${device}-${factoryFormat}-${metadata[0]}.zip`;
                const factoryUrl = baseUrl + factoryFilename;

                const updateFilename = `${device}-ota_update-${metadata[0]}.zip`;
                const updateUrl = baseUrl + updateFilename;

                const release = document.getElementById(`${device}-${channel}`);
                const links = release.querySelectorAll("a, span");

                links[0].textContent = metadata[0];
                if (links[0].nodeName == "A") {
                    links[0].setAttribute("href", "#" + metadata[0]);
                }
                links[1].setAttribute("href", factoryUrl);
                links[2].setAttribute("href", factoryUrl + ".sig");
                links[3].setAttribute("href", updateUrl);
            }));
        }
    }

    await Promise.allSettled(requests);
    setTimeout(updateReleases, delayMs);
}

setTimeout(updateReleases, delayMs);

// @license-end
