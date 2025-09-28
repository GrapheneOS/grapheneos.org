// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

const baseUrl = "https://releases.grapheneos.org/";
const devices = ["tegu", "comet", "komodo", "caiman", "tokay", "akita", "husky", "shiba", "felix", "tangorpro", "lynx", "cheetah", "panther", "bluejay", "raven", "oriole", "barbet", "redfin", "bramble", "sunfish", "coral", "flame"];
const legacyFactoryDevices = new Set(["sunfish", "coral", "flame"]);
const channels = ["stable", "beta", "alpha"];
const delayMs = 1000 * 60 * 5;

async function updateReleases() {
    try {
        const response = await fetch(baseUrl + "overview.json");
        if (!response.ok) {
            return;
        }
        const overview = await response.json();
        for (const device of devices) {
            const releases = overview[device];
            if (releases === undefined) {
                continue;
            }
            for (const channel of channels) {
                const release = releases[channel];

                const factoryFormat = legacyFactoryDevices.has(device) ? "factory" : "install";
                const factoryFilename = `${device}-${factoryFormat}-${release}.zip`;
                const factoryUrl = baseUrl + factoryFilename;

                const updateFilename = `${device}-ota_update-${release}.zip`;
                const updateUrl = baseUrl + updateFilename;

                const section = document.getElementById(`${device}-${channel}`);
                const links = section.querySelectorAll("a, span");

                links[0].textContent = release;
                if (links[0].nodeName == "A") {
                    links[0].setAttribute("href", "#" + release);
                }
                links[1].setAttribute("href", factoryUrl);
                links[2].setAttribute("href", factoryUrl + ".sig");
                links[3].setAttribute("href", updateUrl);
            }
        }
    } finally {
        setTimeout(updateReleases, delayMs);
    }
}

setTimeout(updateReleases, delayMs);

// @license-end
