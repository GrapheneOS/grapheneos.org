// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

import * as fastboot from "./fastboot/dist/fastboot.min.mjs?6";

const RELEASES_URL = "https://releases.grapheneos.org";

const CACHE_DB_NAME = "BlobStore";
const CACHE_DB_VERSION = 1;

// This wraps XHR because getting progress updates with fetch() is overly complicated.
function fetchBlobWithProgress(url, onProgress) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();

    return new Promise((resolve, reject) => {
        xhr.onload = () => {
            resolve(xhr.response);
        };
        xhr.onprogress = (event) => {
            onProgress(event.loaded / event.total);
        };
        xhr.onerror = () => {
            reject(`${xhr.status} ${xhr.statusText}`);
        };
    });
}

class BlobStore {
    constructor() {
        this.db = null;
    }

    async _wrapReq(request, onUpgrade = null) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.oncomplete = () => {
                resolve(request.result);
            };
            request.onerror = (event) => {
                reject(event);
            };

            if (onUpgrade !== null) {
                request.onupgradeneeded = onUpgrade;
            }
        });
    }

    async init() {
        if (this.db === null) {
            this.db = await this._wrapReq(
                indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION),
                (event) => {
                    let db = event.target.result;
                    db.createObjectStore("files", { keyPath: "name" });
                    /* no index needed for such a small database */
                }
            );
        }
    }

    async saveFile(name, blob) {
        this.db.transaction(["files"], "readwrite").objectStore("files").add({
            name: name,
            blob: blob,
        });
    }

    async loadFile(name) {
        try {
            let obj = await this._wrapReq(
                this.db.transaction("files").objectStore("files").get(name)
            );
            return obj.blob;
        } catch (error) {
            return null;
        }
    }

    async close() {
        this.db.close();
    }

    async download(url, onProgress = () => {}) {
        let filename = url.split("/").pop();
        let blob = await this.loadFile(filename);
        if (blob === null) {
            console.log(`Downloading ${url}`);
            let blob = await fetchBlobWithProgress(url, onProgress);
            console.log("File downloaded, saving...");
            await this.saveFile(filename, blob);
            console.log("File saved");
        } else {
            console.log(
                `Loaded ${filename} from blob store, skipping download`
            );
        }

        return blob;
    }
}

let device = new fastboot.FastbootDevice();
let blobStore = new BlobStore();

async function ensureConnected(setProgress) {
    if (!device.isConnected) {
        setProgress("Connecting to device...");
        await device.connect();
    }
}

async function unlockBootloader(setProgress) {
    await ensureConnected(setProgress);

    // Trying to unlock when the bootloader is already unlocked results in a FAIL,
    // so don't try to do it.
    if (await device.getVariable("unlocked") === "yes") {
        return "Bootloader is already unlocked.";
    }

    setProgress("Unlocking bootloader...");
    try {
        await device.runCommand("flashing unlock");
    } catch (error) {
        // FAIL = user rejected unlock
        if (error instanceof fastboot.FastbootError && error.status === "FAIL") {
            throw new Error("Bootloader was not unlocked, please try again!");
        } else {
            throw error;
        }
    }

    return "Bootloader unlocked.";
}

async function getLatestRelease() {
    let product = await device.getVariable("product");

    let metadataResp = await fetch(`${RELEASES_URL}/${product}-stable`);
    let metadata = await metadataResp.text();
    let releaseId = metadata.split(" ")[0];

    return `${product}-factory-${releaseId}.zip`;
}

async function downloadRelease(setProgress) {
    await ensureConnected(setProgress);

    setProgress("Finding latest release...");
    let latestZip = await getLatestRelease();

    // Download and cache the zip as a blob
    setProgress(`Downloading ${latestZip}...`);
    await blobStore.init();
    await blobStore.download(`${RELEASES_URL}/${latestZip}`, (progress) => {
        setProgress(`Downloading ${latestZip}...`, progress);
    });
    setProgress(`Downloaded ${latestZip} release.`, 1.0);
}

async function reconnectCallback() {
    let statusField = document.getElementById("flash-release-status");
    statusField.textContent =
        "To continue flashing, reconnect the device by tapping here:";

    let reconnectButton = document.getElementById("flash-reconnect-button");
    let progressBar = document.getElementById("flash-release-progress");

    // Hide progress bar while waiting for reconnection
    progressBar.hidden = true;
    reconnectButton.hidden = false;

    reconnectButton.onclick = async () => {
        await device.connect();
        reconnectButton.hidden = true;
        progressBar.hidden = false;
    };
}

async function flashRelease(setProgress) {
    await ensureConnected(setProgress);

    // Need to do this again because the user may not have clicked download if
    // it was cached
    setProgress("Finding latest release...");
    let latestZip = await getLatestRelease();
    await blobStore.init();
    let blob = await blobStore.loadFile(latestZip);
    if (blob === null) {
        throw new Error("You need to download a release first!");
    }

    setProgress("Flashing release...");
    await fastboot.FactoryImages.flashZip(
        device, blob, true, reconnectCallback,
        (action, item, progress) => {
            let userAction = fastboot.FactoryImages.USER_ACTION_MAP[action];
            let userItem = item === "avb_custom_key" ? "verified boot key" : item;
            setProgress(`${userAction} ${userItem}...`, progress);
        }
    );

    return `Flashed ${latestZip} to device.`;
}

async function lockBootloader(setProgress) {
    await ensureConnected(setProgress);

    setProgress("Locking bootloader...");
    try {
        await device.runCommand("flashing lock");
    } catch (error) {
        // FAIL = user rejected lock
        if (error instanceof fastboot.FastbootError && error.status === "FAIL") {
            throw new Error("Bootloader was not locked, please try again!");
        } else {
            throw error;
        }
    }

    // We can't explicitly validate the bootloader lock state because it reboots
    // to recovery after locking. Assume that the device would've replied with
    // FAIL if if it wasn't locked.
    return "Bootloader locked.";
}

function addButtonHook(id, callback) {
    let statusContainer = document.getElementById(`${id}-status-container`);
    let statusField = document.getElementById(`${id}-status`);
    let progressBar = document.getElementById(`${id}-progress`);

    let statusCallback = (status, progress) => {
        if (statusContainer !== null) {
            statusContainer.hidden = false;
        }

        statusField.className = "";
        statusField.textContent = status;

        if (progress !== undefined) {
            progressBar.hidden = false;
            progressBar.value = progress;
        }
    };

    let button = document.getElementById(`${id}-button`);
    button.disabled = false;
    button.onclick = async () => {
        try {
            let finalStatus = await callback(statusCallback);
            if (finalStatus !== undefined) {
                statusCallback(finalStatus);
            }
        } catch (error) {
            statusCallback(`Error: ${error.message}`);
            statusField.className = "error-text";
            // Rethrow the error so it shows up in the console
            throw error;
        }
    };
}

// This doesn't really hurt, and because this page is exclusively for web install,
// we can tolerate extra logging in the console in case something goes wrong.
fastboot.setDebugMode(true);

fastboot.FactoryImages.configureZip({
    workerScripts: {
        inflate: ["/js/fastboot/dist/vendor/z-worker-pako.js", "pako_inflate.min.js"],
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
