// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

const CHEVRON_UP_SVG = "<svg aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\" height=\"24px\" viewBox=\"0 -960 960 960\" width=\"24px\" fill=\"currentColor\"><path d=\"M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z\"/></svg>";

function showElement(element) {
    element.removeAttribute("style");
}

function hideElement(element) {
    element.setAttribute("style", "display: none");
}

function createBackToTocButton() {
    const backToTocButton = document.createElement("button");

    backToTocButton.innerHTML = CHEVRON_UP_SVG;
    backToTocButton.ariaLabel = "Go back to Table of Contents";
    backToTocButton.classList.add("back-to-toc");

    // hide the button immediately to avoid it being displayed on page refresh
    // before the "scroll" event has been fired.
    hideElement(backToTocButton);

    return backToTocButton;
}

function hasScrolledPastToc(toc) {
    return window.scrollY > (toc.offsetTop + toc.offsetHeight);
}

document.addEventListener("DOMContentLoaded", () => {
    const backToTocButton = createBackToTocButton();
    const toc = document.getElementById("table-of-contents");

    window.addEventListener("scroll", () => {
        if (hasScrolledPastToc(toc)) {
            showElement(backToTocButton);
        } else {
            hideElement(backToTocButton);
        }
    });

    backToTocButton.addEventListener("click", () => {
        window.scrollTo({ top: toc.offsetTop, behavior: "smooth" });
    });

    document.body.append(backToTocButton);
});