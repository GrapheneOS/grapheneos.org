// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

import { FastbootDevice } from "./fastboot/fastboot.js";
import * as Factory from "./fastboot/factory.js";

const RELEASES_URL = "https://releases.grapheneos.org";

let device = new FastbootDevice();
let lastReleaseZip = null;

async function ensureConnected(setProgress) {
    console.log(device.device);
    if (!device.isConnected) {
        setProgress("Connecting to device...");
        await device.connect();
    }
}

async function unlockBootloader(setProgress) {
    await ensureConnected(setProgress);

    setProgress("Unlocking bootloader...");
    await device.runCommand("flashing unlock");
    return "Bootloader unlocked.";
}

async function downloadRelease(setProgress) {
    await ensureConnected(setProgress);

    setProgress("Getting device model...");
    let product = await device.getVariable("product");
    setProgress("Finding latest release...");
    let metadataResp = await fetch(`${RELEASES_URL}/${product}-stable`);
    let metadata = await metadataResp.text();
    let releaseId = metadata.split(" ")[0];

    // Download and cache the zip as a blob
    setProgress(`Downloading ${releaseId} release for ${product}...`);
    lastReleaseZip = `${product}-factory-${releaseId}.zip`;
    await Factory.downloadZip(`${RELEASES_URL}/${lastReleaseZip}`);
    return `Downloaded ${releaseId} release for ${product}.`;
}

async function flashRelease(setProgress) {
    await ensureConnected(setProgress);

    setProgress("Flashing release...");
    await Factory.flashZip(device, lastReleaseZip, (action, partition) => {
        let userPartition = partition == "avb_custom_key" ? "verified boot key" : partition;
        if (action == "unpack") {
            setProgress(`Unpacking image: ${userPartition}`);
        } else {
            setProgress(`Flashing image: ${userPartition}`);
        }
    });
    return `Flashed ${lastReleaseZip} to device.`;
}

async function lockBootloader(setProgress) {
    await ensureConnected(setProgress);

    setProgress("Locking bootloader...");
    await device.runCommand("flashing lock");
    return "Bootloader locked.";
}

function addButtonHook(id, callback) {
    let statusField = document.getElementById(`${id}-status`);
    let statusCallback = (status) => {
        statusField.textContent = status;
        statusField.className = "";
    };

    let button = document.getElementById(`${id}-button`);
    button.disabled = false;
    button.onclick = async () => {
        try {
            let finalStatus = await callback(statusCallback);
            statusCallback(finalStatus);
        } catch (error) {
            statusCallback(`Error: ${error.message}`);
            statusField.className = "error-text";
        }
    };
}

// zip.js is loaded separately.
// eslint-disable-next-line no-undef
zip.configure({
    workerScripts: {
        inflate: ["/js/fastboot/libs/z-worker-pako.js", "pako_inflate.min.js"],
    },
});

if ("usb" in navigator) {
    console.log("WebUSB available");

    addButtonHook("unlock-bootloader", unlockBootloader);
    addButtonHook("download-release", downloadRelease);
    addButtonHook("flash-release", flashRelease);
    addButtonHook("lock-bootloader", lockBootloader);
} else {
    console.log("WebUSB unavailable");
}

// @license-end
