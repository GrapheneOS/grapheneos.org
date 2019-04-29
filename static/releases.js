"use strict";

const baseUrl = "https://seamlessupdate.app/";
const versionBaseUrl = "https://github.com/GrapheneOS/platform_manifest/releases/tag/";
const devices = ["blueline", "crosshatch", "taimen", "walleye", "marlin", "sailfish"];
const channels = ["stable", "beta"];

function createLink(href, text) {
    const link = document.createElement("a");
    link.appendChild(document.createTextNode(text));
    link.href = href;
    return link;
}

function deviceModel(device) {
    if (device === "blueline") {
        return "Pixel 3";
    }
    if (device === "crosshatch") {
        return "Pixel 3 XL";
    }
    if (device === "taimen") {
        return "Pixel 2 XL";
    }
    if (device === "walleye") {
        return "Pixel 2";
    }
    if (device === "marlin") {
        return "Pixel 1 XL (legacy)";
    }
    if (device === "sailfish") {
        return "Pixel 1 (legacy)";
    }
    return device;
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

            const model = deviceModel(device);

            const release = document.createElement("div");
            release.dataset.model = model;

            const header = document.createElement("h3");
            header.appendChild(document.createTextNode(model));
            release.appendChild(header);

            const tag = metadata[2] + "." + metadata[0];
            const version = document.createElement("p");
            if (device !== "marlin" && device !== "sailfish") {
                version.appendChild(document.createTextNode("Version: "));
                version.appendChild(createLink(versionBaseUrl + tag, tag));
            } else {
                version.appendChild(document.createTextNode("Version: " + tag));
            }
            release.appendChild(version);

            release.appendChild(createLink(factoryUrl, factoryFilename));
            release.appendChild(document.createElement("br"));
            release.appendChild(createLink(factoryUrl + ".sig", factoryFilename + ".sig"));
            release.appendChild(document.createElement("br"));
            release.appendChild(createLink(updateUrl, updateFilename));

            const list = document.getElementById(channel);
            for (const item of list.children) {
                if (model > item.dataset.model) {
                    list.insertBefore(release, item);
                    return;
                }
            }
            list.appendChild(release);
        });
    }
}
