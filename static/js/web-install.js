// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

async function adbRebootBootloader() {
    const webusb = await Adb.open("WebUSB");

    if (!webusb.isAdb()) {
        console.log("error: not in adb mode");
        return;
    }

    console.log("connecting with adb");

    const adb = await webusb.connectAdb("host::");
    await adb.reboot("bootloader");
}

async function unlockBootloader() {
    const webusb = await Adb.open("WebUSB");

    if (!webusb.isFastboot()) {
        console.log("error: not in fastboot mode");
    }

    console.log("connecting with fastboot");

    const fastboot = await webusb.connectFastboot();
    await fastboot.send("flashing unlock");
    await fastboot.receive();
}

if ("usb" in navigator) {
    console.log("WebUSB available");

    const adbRebootBootloaderButton = document.getElementById("adb-reboot-bootloader");
    adbRebootBootloaderButton.disabled = false;
    adbRebootBootloaderButton.onclick = adbRebootBootloader;

    const unlockBootloaderButton = document.getElementById("unlock-bootloader");
    unlockBootloaderButton.disabled = false;
    unlockBootloaderButton.onclick = unlockBootloader;
} else {
    console.log("WebUSB unavailable");
}

// @license-end
