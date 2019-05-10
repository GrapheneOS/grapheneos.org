"use strict";

const baseUrl = "https://seamlessupdate.app/";
const versionBaseUrl = "https://github.com/GrapheneOS/platform_manifest/releases/tag/";
const devices = ["crosshatch", "blueline", "taimen", "walleye", "marlin", "sailfish"];
const channels = ["stable", "beta"];

for (const channel of channels) {
    for (const device of devices) {
        fetch(baseUrl + device + "-" + channel).then(response => {
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
        });
    }
}
