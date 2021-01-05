// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

async function doConnect() {
    const webusb = await Adb.open("WebUSB");

    console.log("connected");

    if (webusb.isAdb()) {
        console.log("adb");
        const adb = await webusb.connectAdb("host::");
        await adb.reboot("bootloader");
        return;
    }

    if (webusb.isFastboot()) {
        console.log("fastboot");
        const fastboot = await webusb.connectFastboot();
        await fastboot.send("flashing unlock");
        await fastboot.receive();
    }
}

if ("usb" in navigator) {
    console.log("WebUSB available");

    const connect = document.getElementById("connect");
    connect.onclick = doConnect;
} else {
    console.log("WebUSB unavailable");
}

// @license-end
