// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

const baseUrl = "https://releases.grapheneos.org/";
const versionBaseUrl = "https://github.com/GrapheneOS/platform_manifest/releases/tag/";
const devices = ["barbet", "redfin", "bramble", "sunfish", "coral", "flame", "bonito", "sargo", "crosshatch", "blueline"];
const channels = ["stable", "beta"];
const delayMs = 1000 * 60 * 5;

async function updateReleases() {
    const requests = [];

    for (const channel of channels) {
        for (const device of devices) {
            requests.push(fetch(baseUrl + device + "-" + channel).then(response => {
                if (!response.ok) {
                    return Promise.reject();
                }
                return response.text();
            }).then(text => {
                const metadata = text.trim().split(" ");

                const factoryFilename = device + "-factory-" + metadata[0] + ".zip";
                const factoryUrl = baseUrl + factoryFilename;

                const updateFilename = device + "-ota_update-" + metadata[0] + ".zip";
                const updateUrl = baseUrl + updateFilename;

                const tag = metadata[2] + "." + metadata[0];

                const release = document.getElementById(device + "-" + channel);
                const links = release.getElementsByTagName("a");

                links[1].innerText = tag;
                links[1].setAttribute("href", versionBaseUrl + tag);

                links[2].innerText = factoryFilename;
                links[2].setAttribute("href", factoryUrl);

                links[3].innerText = factoryFilename + ".sig";
                links[3].setAttribute("href", factoryUrl + ".sig");

                links[4].innerText = updateFilename;
                links[4].setAttribute("href", updateUrl);
            }));
        }
    }

    await Promise.allSettled(requests);
    setTimeout(updateReleases, delayMs);
}

updateReleases();

// @license-end
