// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

import * as fastboot from "./fastboot/066d736d/fastboot.min.mjs";

const CACHE_DB_NAME = "BlobStore";
const CACHE_DB_VERSION = 1;

const Buttons = {
    OBTAIN_CALIBRATION: "obtain-calibration-file",
    FLASH_CALIBRATION: "flash-calibration-file",
};

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

function setButtonState({ id, enabled }) {
    const button = document.getElementById(`${id}-button`);
    button.disabled = !enabled;
    return button;
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

class ButtonController {
    #map;

    constructor() {
        this.#map = new Map();
    }

    setEnabled(...ids) {
        ids.forEach((id) => {
            // Only enable button if it won't be disabled.
            if (!this.#map.has(id)) {
                this.#map.set(id, /* enabled = */ true);
            }
        });
    }

    setDisabled(...ids) {
        ids.forEach((id) => this.#map.set(id, /* enabled = */ false));
    }

    applyState() {
        this.#map.forEach((enabled, id) => {
            setButtonState({ id, enabled });
        });
        this.#map.clear();
    }
}

let device = new fastboot.FastbootDevice();
let blobStore = new BlobStore();
let buttonController = new ButtonController();

async function ensureConnected(setProgress) {
    if (!device.isConnected) {
        setProgress("Connecting to device...");
        await device.connect();
    }
}

const supportedDevices = ["lynx", "cheetah", "panther", "bluejay", "raven", "oriole"];

async function reconnectCallback() {
    let statusField = document.getElementById("flash-calibration-file-status");
    statusField.textContent =
        "To continue flashing, reconnect the device by tapping here:";

    let reconnectButton = document.getElementById("flash-calibration-file-reconnect-button");

    reconnectButton.hidden = false;

    reconnectButton.onclick = async () => {
        await device.connect();
        reconnectButton.hidden = true;
    };
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

    let button = setButtonState({ id, enabled: true });
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

async function obtainCalibration() {
    await device.runCommand("oem get-cal-url ");
    // save output from fastboot command
    // fetchBlobWithProgress <url>
    console.log("unimplemented");
}

async function flashCalibration() {
    // fastboot stage <blob>
    await device.runCommand("oem update-cal ");
    await device.reboot("bootloader", 4000, reconnectCallback);
    console.log("unimplemented");
}

let safeToLeave = true;

// This doesn't really hurt, and because this page is exclusively for web install,
// we can tolerate extra logging in the console in case something goes wrong.
fastboot.setDebugLevel(2);

if ("usb" in navigator) {
    addButtonHook(Buttons.OBTAIN_CALIBRATION, obtainCalibration);
    addButtonHook(Buttons.FLASH_CALIBRATION, flashCalibration);
} else {
    console.log("WebUSB unavailable");
}

// This will create an alert box to stop the user from leaving the page during actions
window.addEventListener("beforeunload", event => {
    if (!safeToLeave) {
        console.log("User tried to leave the page whilst unsafe to leave!");
        event.returnValue = "";
    }
});

// @license-end
