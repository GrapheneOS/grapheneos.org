// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

const baseUrl = "https://releases.grapheneos.org/";
const devices = ["comet", "komodo", "caiman", "tokay", "akita", "husky", "shiba", "felix", "tangorpro", "lynx", "cheetah", "panther", "bluejay", "raven", "oriole", "barbet", "redfin", "bramble", "sunfish", "coral", "flame"];
const legacyFactoryDevices = new Set(["sunfish", "coral", "flame"]);
const channels = ["stable", "beta", "alpha"];
const delayMs = 1000 * 60 * 5;

function updateLink(link, text, url) {
    link.innerText = text;
    link.setAttribute("href", url);
}

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
                const links = release.getElementsByTagName("a");

                updateLink(links[1], metadata[0], "#" + metadata[0]);
                updateLink(links[2], factoryFilename, factoryUrl);
                updateLink(links[3], factoryFilename + ".sig", factoryUrl + ".sig");
                updateLink(links[4], updateFilename, updateUrl);
            }));
        }
    }

    await Promise.allSettled(requests);
    setTimeout(updateReleases, delayMs);
}

setTimeout(updateReleases, delayMs);

// @license-end
