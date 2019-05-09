"use strict";

const baseUrl = "https://seamlessupdate.app/";
const versionBaseUrl = "https://github.com/GrapheneOS/platform_manifest/releases/tag/";
const devices = ["crosshatch", "blueline", "taimen", "walleye", "marlin", "sailfish"];
const snapshot = [];
const channels = ["stable", "beta"];

function createLink(href, text) {
    const link = document.createElement("a");
    link.appendChild(document.createTextNode(text));
    link.href = href;
    return link;
}

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

            const release = document.getElementById(device + "-" + channel);

            const tag = metadata[2] + "." + metadata[0];
            const version = document.createElement("p");
            if (snapshot.includes(device)) {
                version.appendChild(document.createTextNode("Version: " + tag));
            } else {
                version.appendChild(document.createTextNode("Version: "));
                version.appendChild(createLink(versionBaseUrl + tag, tag));
            }
            release.replaceChild(version, release.getElementsByTagName("p")[0]);

            const links = release.getElementsByTagName("a");

            release.replaceChild(createLink(factoryUrl, factoryFilename), links[2]);
            release.replaceChild(createLink(factoryUrl + ".sig", factoryFilename + ".sig"), links[3]);
            release.replaceChild(createLink(updateUrl, updateFilename), links[4]);
        });
    }
}
