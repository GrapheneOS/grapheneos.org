// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

import * as fastboot from "./fastboot/ffe7e270/fastboot.min.mjs";

const RELEASES_URL = "https://releases.grapheneos.org";

const CACHE_DB_NAME = "BlobStore";
const CACHE_DB_VERSION = 1;

const Buttons = {
    UNLOCK_BOOTLOADER: "unlock-bootloader",
    DOWNLOAD_RELEASE: "download-release",
    FLASH_RELEASE: "flash-release",
    LOCK_BOOTLOADER: "lock-bootloader",
    REMOVE_CUSTOM_KEY: "remove-custom-key"
};

const InstallerState = {
    DOWNLOADING_RELEASE: 0x1,
    INSTALLING_RELEASE: 0x2
};

let wakeLock = null;

const requestWakeLock = async () => {
    try {
        wakeLock = await navigator.wakeLock.request("screen");
        console.log("Wake lock has been set");
        wakeLock.addEventListener("release", async () => {
            console.log("Wake lock has been released");
        });
    } catch (error) {
        // if wake lock request fails - usually system related, such as battery
        throw new Error("wake lock failed", { cause: error });
    }
};

const releaseWakeLock = async () => {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
        } finally {
            wakeLock = null;
        }
    }
};

// reacquires the wake lock should the visibility of the document change and the wake lock is released
document.addEventListener("visibilitychange", async () => {
    if (wakeLock !== null && document.visibilityState === "visible") {
        await requestWakeLock();
    }
});

// This wraps XHR because getting progress updates with fetch() is overly complicated.
function fetchBlobWithProgress(url, onProgress) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.send();

    return new Promise((resolve, reject) => {
        xhr.onload = () => {
            if (xhr.status !== 200) {
                reject(`${xhr.status} ${xhr.statusText}`);
            } else {
                resolve(xhr.response);
            }
        };
        xhr.onprogress = (event) => {
            if (event.lengthComputable && event.total > 0) {
                onProgress(event.loaded / event.total);
            }
        };
        xhr.onerror = () => {
            // onerror is called on network errors
            // status and statusText are populated with default values
            reject("Network request failed");
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
            request.onerror = () => {
                reject(request.error);
            };

            if (onUpgrade !== null) {
                request.onupgradeneeded = onUpgrade;
            }
        });
    }

    async _wrapTransaction(transaction) {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                resolve(transaction.result);
            };
            transaction.onerror = () => {
                reject(transaction.error);
            };
            transaction.onabort = () => {
                reject(transaction.error);
            };
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
        const transaction = this.db.transaction(["files"], "readwrite");
        const request = transaction.objectStore("files").add({
            name: name,
            blob: blob,
        });
        await Promise.all([this._wrapTransaction(transaction), this._wrapReq(request)]);
    }

    async loadFile(name) {
        try {
            let obj = await this._wrapReq(
                this.db.transaction("files").objectStore("files").get(name)
            );
            return obj.blob;
        } catch {
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
            blob = await fetchBlobWithProgress(url, onProgress);
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

let installerState = 0;

let device = new fastboot.FastbootDevice();
let blobStore = new BlobStore();
let buttonController = new ButtonController();

async function ensureConnected(setProgress) {
    if (!device.isConnected) {
        setProgress("Connecting to your Pixel...");
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

    setProgress("Waiting for confirmation on your Pixel...");
    try {
        await device.runCommand("flashing unlock");
    } catch (error) {
        // FAIL = user rejected unlock
        if (error instanceof fastboot.FastbootError && error.status === "FAIL") {
            throw new Error("Bootloader was not unlocked, please try again!", { cause: error });
        } else {
            throw error;
        }
    }

    return "Bootloader unlocked. Continue to Download GrapheneOS below.";
}

// Keep device support as an explicit installer allowlist. The rendered hash list is
// the single source for the model name and verified boot key shown after installation.
const supportedDevices = [
    "stallion", "rango", "mustang", "blazer", "frankel", "tegu", "comet",
    "komodo", "caiman", "tokay", "akita", "husky", "shiba", "felix",
    "tangorpro", "lynx", "cheetah", "panther", "bluejay", "raven", "oriole"
];
const verifiedBootKeyEntries = Array.from(
    document.querySelectorAll("#verified-boot-key-hash [data-product]")
);

let selectedProduct = null;

async function getLatestRelease() {
    let product = await device.getVariable("product");
    if (!supportedDevices.includes(product)) {
        throw new Error(`device model (${product}) is not supported by the GrapheneOS web installer`);
    }
    selectedProduct = product;

    let metadataResp = await fetch(`${RELEASES_URL}/${product}-stable`);
    if (!metadataResp.ok) {
        throw new Error("release metadata unavailable");
    }
    let metadata = await metadataResp.text();
    // Stable channel metadata begins with a 10-digit GrapheneOS release ID.
    let releaseId = metadata.trim().split(/\s+/)[0];
    if (!/^\d{10}$/.test(releaseId)) {
        throw new Error("invalid release metadata");
    }

    return `${product}-install-${releaseId}.zip`;
}

function showInstalledDeviceHash() {
    // Use textContent throughout: the device only selects an existing trusted entry
    // and cannot inject markup into the page.
    const deviceKey = verifiedBootKeyEntries.find(
        entry => entry.dataset.product === selectedProduct
    );
    if (deviceKey === undefined) {
        return;
    }

    const deviceName = deviceKey.childNodes[0].textContent.trim().replace(/:$/, "");
    const hash = deviceKey.querySelector("code").textContent;
    document.getElementById("installed-device-name").textContent = deviceName;
    document.getElementById("installed-device-hash-value").textContent = hash;
    document.getElementById("installed-device-hash").hidden = false;
    document.getElementById("verified-boot-hash-match-button").disabled = false;
}

function confirmVerifiedBootHash() {
    const button = document.getElementById("verified-boot-hash-match-button");
    button.disabled = true;
    button.textContent = "Hash match confirmed";
    document.getElementById("verified-boot-hash-success").hidden = false;
}

async function downloadRelease(setProgress) {
    await requestWakeLock();
    await ensureConnected(setProgress);

    setProgress("Checking for the latest GrapheneOS release...");
    let latestZip = await getLatestRelease();

    // Download and cache the zip as a blob
    setInstallerState({ state: InstallerState.DOWNLOADING_RELEASE, active: true });
    setProgress("Downloading GrapheneOS...");
    await blobStore.init();
    try {
        await blobStore.download(`${RELEASES_URL}/${latestZip}`, (progress) => {
            const percentage = Math.round(progress * 100);
            setProgress(`Downloading GrapheneOS... ${percentage}%`, progress);
        });
    } finally {
        setInstallerState({ state: InstallerState.DOWNLOADING_RELEASE, active: false });
        await releaseWakeLock();
    }
    return "Download complete. GrapheneOS is ready to install. Continue to Install GrapheneOS below.";
}

async function reconnectCallback() {
    let statusField = document.getElementById("flash-release-status");
    statusField.textContent =
        "Your Pixel restarted. Click Reconnect device to continue the installation.";

    let reconnectButton = document.getElementById("flash-reconnect-button");
    let progressBar = document.getElementById("flash-release-progress");

    // Hide progress bar while waiting for reconnection
    progressBar.hidden = true;
    reconnectButton.hidden = false;

    reconnectButton.onclick = async () => {
        reconnectButton.disabled = true;
        reconnectButton.setAttribute("aria-busy", "true");
        try {
            await device.connect();
            statusField.className = "";
            statusField.textContent = "Pixel reconnected. Continuing the installation...";
            reconnectButton.hidden = true;
            progressBar.hidden = false;
        } catch (error) {
            statusField.className = "error-text";
            statusField.textContent = getFriendlyErrorMessage(error, Buttons.FLASH_RELEASE);
            console.error(error);
        } finally {
            reconnectButton.disabled = false;
            reconnectButton.setAttribute("aria-busy", "false");
        }
    };
}

async function flashRelease(setProgress) {
    await requestWakeLock();
    await ensureConnected(setProgress);

    // Need to do this again because the user may not have clicked download if
    // it was cached
    setProgress("Preparing GrapheneOS for installation...");
    let latestZip = await getLatestRelease();
    await blobStore.init();
    let blob = await blobStore.loadFile(latestZip);
    if (blob === null) {
        throw new Error("You need to download a release first!");
    }

    setProgress("Preparing your Pixel...");
    // Cancel snapshot update if in progress
    let snapshotStatus = await device.getVariable("snapshot-update-status");
    if (snapshotStatus !== null && snapshotStatus !== "none") {
        await device.runCommand("snapshot-update:cancel");
    }

    setProgress("Installing GrapheneOS. Keep your Pixel connected...");
    setInstallerState({ state: InstallerState.INSTALLING_RELEASE, active: true });
    try {
        await device.flashFactoryZip(blob, true, reconnectCallback,
            (...progressUpdate) => {
                const progress = progressUpdate[2];
                setProgress("Installing GrapheneOS. Keep your Pixel connected...", progress);
            }
        );
    } finally {
        setInstallerState({ state: InstallerState.INSTALLING_RELEASE, active: false });
        await releaseWakeLock();
    }

    showInstalledDeviceHash();
    return "Installation complete. Keep your Pixel connected and lock the bootloader below.";
}

async function eraseNonStockKey(setProgress) {
    await ensureConnected(setProgress);

    setProgress("Removing the GrapheneOS verified boot key...");
    try {
        await device.runCommand("erase:avb_custom_key");
    } catch (error) {
        console.log(error);
        throw error;
    }
    return "Verified boot key removed. You can now continue with the original Pixel OS installation.";
}

async function lockBootloader(setProgress) {
    await ensureConnected(setProgress);

    setProgress("Waiting for confirmation on your Pixel...");
    try {
        await device.runCommand("flashing lock");
    } catch (error) {
        // FAIL = user rejected lock
        if (error instanceof fastboot.FastbootError && error.status === "FAIL") {
            throw new Error("Bootloader was not locked, please try again!", { cause: error });
        } else {
            throw error;
        }
    }

    return "Bootloader locked. Installation is complete. Continue to Start GrapheneOS below.";
}

function getFriendlyErrorMessage(error, action) {
    const message = typeof(error) === "object" && error !== null && error.message
        ? error.message
        : String(error);
    const lowerMessage = message.toLowerCase();

    if (error instanceof DOMException) {
        if (error.name === "QuotaExceededError") {
            return "There is not enough browser storage for GrapheneOS. Free up storage and make sure you are not using Incognito or private browsing, then try again.";
        }
        if (error.name === "NotFoundError") {
            return "No Pixel was selected. Keep your Pixel connected and in Fastboot mode, click the button again, then choose your Pixel in the browser prompt.";
        }
        if (error.name === "NotAllowedError" || error.name === "SecurityError") {
            return "USB access was not approved. Click the button again, choose your Pixel and approve the connection prompt.";
        }
        if (error.name === "NetworkError" || error.name === "AbortError") {
            return "The USB connection was interrupted. Keep your Pixel in Fastboot mode, reconnect the cable directly and try this step again.";
        }
        if (error.name === "InvalidStateError") {
            return "The Pixel is not ready for this step. Keep it in Fastboot mode, reconnect it and try again.";
        }
    }

    if (error instanceof fastboot.FastbootError) {
        if (error.status === "FAIL") {
            return "The Pixel did not complete this action. Follow any instructions on its screen, then try again.";
        }
        return "Communication with the Pixel was interrupted. Keep it connected and in Fastboot mode, then try this step again.";
    }

    if (lowerMessage.includes("wake lock")) {
        return "The browser could not keep the screen awake. Turn off battery saver, keep this page visible and try again.";
    }
    if (lowerMessage.includes("quota") || lowerMessage.includes("storage")) {
        return "There is not enough browser storage for GrapheneOS. Free up storage and make sure you are not using Incognito or private browsing, then try again.";
    }
    if (lowerMessage.includes("failed to write") || lowerMessage.includes("ioerror") ||
        lowerMessage.includes("could not be read")) {
        return "The browser could not store the GrapheneOS download. Free up storage, close other apps and use a normal browser window, then download it again.";
    }
    if (lowerMessage.includes("network request failed") || /^\d{3} /.test(message)) {
        return "The GrapheneOS download failed. Check the internet connection, available storage and browser requirements below, then try again.";
    }
    if (lowerMessage.includes("no device selected")) {
        return "No Pixel was selected. Click the button again, choose your Pixel in the browser prompt and approve the connection.";
    }
    if (lowerMessage.includes("permission") || lowerMessage.includes("access denied") ||
        lowerMessage.includes("claim interface")) {
        return "The browser could not access the Pixel. Approve the USB prompt, close other apps using the Pixel and check the USB guidance in step 3, then try again.";
    }
    if (lowerMessage.includes("disconnect") || lowerMessage.includes("transfer") ||
        lowerMessage.includes("connection")) {
        return "The USB connection was interrupted. Keep your Pixel in Fastboot mode, reconnect the cable directly and try this step again.";
    }
    if (lowerMessage.includes("device model") && lowerMessage.includes("not supported")) {
        return "This Pixel model is not supported by the GrapheneOS web installer. Check the supported Pixel list above.";
    }
    if (lowerMessage.includes("download a release first")) {
        return "Download GrapheneOS in the previous step before starting the installation.";
    }
    if (lowerMessage.includes("bootloader was not unlocked")) {
        return "The bootloader was not unlocked. Choose the unlock option on your Pixel and try again.";
    }
    if (lowerMessage.includes("bootloader was not locked")) {
        return "The bootloader was not locked. Choose the lock option on your Pixel and try again.";
    }

    switch (action) {
        case Buttons.UNLOCK_BOOTLOADER:
            return "The unlock could not start. Keep your Pixel in Fastboot mode, reconnect the cable, approve the USB prompt and click Unlock bootloader again.";
        case Buttons.DOWNLOAD_RELEASE:
            return "GrapheneOS could not be downloaded. Check the internet connection and available storage, then click Download GrapheneOS again.";
        case Buttons.FLASH_RELEASE:
            return "Installation stopped before it finished. Keep your Pixel connected and in Fastboot mode, then click Install GrapheneOS again.";
        case Buttons.LOCK_BOOTLOADER:
            return "The bootloader could not be locked. Keep your Pixel in Fastboot mode, reconnect it and click Lock bootloader again.";
        case Buttons.REMOVE_CUSTOM_KEY:
            return "The GrapheneOS verified boot key could not be removed. Keep your Pixel in Fastboot mode, reconnect it and try again.";
        default:
            return "This step could not be completed. Keep your Pixel connected and in Fastboot mode, then try again.";
    }
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
        let completed = false;
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        try {
            let finalStatus = await callback(statusCallback);
            if (finalStatus !== undefined) {
                statusCallback(finalStatus);
                statusField.className = "success-text";
                completed = true;
                if (progressBar !== null) {
                    progressBar.hidden = false;
                    progressBar.value = 1;
                }
            }
        } catch (error) {
            statusCallback(getFriendlyErrorMessage(error, id));
            statusField.className = "error-text";
            await releaseWakeLock();
            // Rethrow the error so it shows up in the console
            throw error;
        } finally {
            button.disabled = completed;
            button.setAttribute("aria-busy", "false");
        }
    };
}

function setInstallerState({ state, active }) {
    if (active) {
        installerState |= state;
    } else {
        installerState &= ~state;
    }
    invalidateInstallerState();
}

function isInstallerStateActive(state) {
    return (installerState & state) === state;
}

function invalidateInstallerState() {
    if (isInstallerStateActive(InstallerState.DOWNLOADING_RELEASE)) {
        buttonController.setDisabled(Buttons.DOWNLOAD_RELEASE);
    } else {
        buttonController.setEnabled(Buttons.DOWNLOAD_RELEASE);
    }

    let disableWhileInstalling = [
        Buttons.DOWNLOAD_RELEASE,
        Buttons.FLASH_RELEASE,
        Buttons.LOCK_BOOTLOADER,
        Buttons.REMOVE_CUSTOM_KEY,
    ];
    if (isInstallerStateActive(InstallerState.INSTALLING_RELEASE)) {
        buttonController.setDisabled(...disableWhileInstalling);
    } else {
        buttonController.setEnabled(...disableWhileInstalling);
    }

    buttonController.applyState();
}

function safeToLeave() {
    return installerState === 0;
}

// This doesn't really hurt, and because this page is exclusively for web install,
// we can tolerate extra logging in the console in case something goes wrong.
fastboot.setDebugLevel(2);

fastboot.configureZip({
    workerScripts: {
        inflate: ["/js/fastboot/ffe7e270/vendor/z-worker-pako.js", "pako_inflate.min.js"],
    },
});

if ("usb" in navigator) {
    document.getElementById("verified-boot-hash-match-button").onclick = confirmVerifiedBootHash;
    addButtonHook(Buttons.UNLOCK_BOOTLOADER, unlockBootloader);
    addButtonHook(Buttons.DOWNLOAD_RELEASE, downloadRelease);
    addButtonHook(Buttons.FLASH_RELEASE, flashRelease);
    addButtonHook(Buttons.LOCK_BOOTLOADER, lockBootloader);
    addButtonHook(Buttons.REMOVE_CUSTOM_KEY, eraseNonStockKey);

    if (navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then(estimate => {
            // Currently factory images are ~1700MiB
            // Show a warning if the estimated space is below 2000MiB
            if (estimate.quota !== 0 && estimate.quota < 2000 * 1024 * 1024) {
                document.getElementById("quota-warning-text").hidden = false;
            }
        });
    }
} else {
    console.log("WebUSB unavailable");
    for (const btnId in Buttons) {
        const elementId = Buttons[btnId];
        const statusContainer = document.getElementById(`${elementId}-status-container`);
        const statusField = document.getElementById(`${elementId}-status`);
        if (statusContainer !== null) {
            statusContainer.hidden = false;
        }
        statusField.className = "error-text";
        statusField.textContent = "This browser cannot connect to your Pixel over USB. Open this page in a supported browser listed above, then reconnect your Pixel.";
    }
}

// This will create an alert box to stop the user from leaving the page during actions
window.addEventListener("beforeunload", event => {
    if (!safeToLeave()) {
        console.log("User tried to leave the page whilst unsafe to leave!");
        event.returnValue = "";
    }
});

// @license-end
