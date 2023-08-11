// The current screensize, needs to be the same as in static/main.css
let screenSizes = { sm: 735, lg: Infinity };
let currentScreenSize = screenSizes.lg;
let eventListeners = [];
let deviceSupportsHover = true;

/**
 * @callback eventCallback
 * @param {MouseEvent}
 * @param {HTMLElement}
 */

/**
 * Helper util to add a click event listener to an element
 *
 * @param {string|HTMLElement} selector - If a string is passed then the HTMLElement returned by querySelector will be used
 * @param [eventCallback} callback
 * @param {string=click} - The event type to listen too
 * @returns {Function} - Function to remove the click event
 */
function onEvent(selector, callback, type = "click") {
    const el = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!el) {
        return;
    }

    const cb = (e) => callback(e, el);
    el.addEventListener(type, cb);
    return () => el.removeEventListener(type, cb);
}

/**
 * Add all required menu opening/close listeners
 */
function addMenuListeners() {
    eventListeners.forEach(remove => remove?.());
    eventListeners.splice(0, Infinity);

    // MAIN MENU TOGGLE
    if (currentScreenSize === screenSizes.sm) {
        // The menu toggle is only visible/used on small screens
        eventListeners.push(
            onEvent("#menu-toggle", (e, el) => {
                const isExpanded = el.getAttribute("aria-expanded") === "true";
                el.setAttribute("aria-expanded", !isExpanded);
            })
        );
    }

    // SUB MENUS IN MAIN MENU
    document.querySelectorAll("#main-menu [aria-haspopup=\"true\"]").forEach((el) => {
        if (!deviceSupportsHover || currentScreenSize === screenSizes.sm) {
            // For small screens or when the device doesnt support hovering, add
            // a click listener to toggle the submenu dropdown
            eventListeners.push(
                onEvent(el, (e) => {
                    e.stopPropagation();

                    const isExpanded = el.getAttribute("aria-expanded") === "true";
                    el.setAttribute("aria-expanded", !isExpanded);

                    if (!isExpanded) {
                        // Add a click listener on the body so that the dropdown closes
                        // when you click anywhere else on the body
                        const stopBodyClickListener = onEvent(document.body, (e) => {
                            const clickedWithinTOC = !!e.target.closest(".dropdown");
                            if (!clickedWithinTOC) {
                                el.setAttribute("aria-expanded", false);
                                stopBodyClickListener();
                            }
                        });
                    }
                })
            );
        }

        if (deviceSupportsHover && currentScreenSize !== screenSizes.sm) {
            // On screens larger then small that supports hovering also listen for mouseover events
            eventListeners.push(
                onEvent(el, () => {
                    el.setAttribute("aria-expanded", true);

                    const mainMenuItem = el.closest("#main-menu > li");

                    const stopMouseMoveListener = onEvent(document.body, (e) => {
                        const target = e.target;
                        const currentMainMenuItem = target.closest("#main-menu > li");

                        // Hide the open submenu if the mouse move was not over the
                        // top menu item or open submenu
                        if (!currentMainMenuItem || currentMainMenuItem !== mainMenuItem) {
                            el.setAttribute("aria-expanded", false);
                            stopMouseMoveListener();
                        }
                    }, "mousemove");
                }, "mouseover")
            );

        }
    });

    // Check if a TOC exists on the current page
    const tocToggle = document.querySelector("#toc-toggle");
    if (!tocToggle) {
        return;
    }

    if (currentScreenSize === screenSizes.sm) {
        tocToggle.setAttribute("aria-haspopup", true);
        tocToggle.setAttribute("aria-controls", "toc-menu");

        // Add click listener on TOC toggle
        eventListeners.push(
            onEvent(tocToggle, (e, el) => {
                const isExpanded = el.getAttribute("aria-expanded") === "true";

                // To prevent scrolling the main page, add a no-scroll class to the body
                // which fixes the position/size of the main page when the TOC is opened.
                // Because this would reset the scroll position, we need to save the scroll
                // position and restore it after the TOC is closed again
                const scrollY = isExpanded ? +document.body.getAttribute("data-scroll-y") : window.scrollY;

                el.setAttribute("aria-expanded", !isExpanded);
                document.body.classList.toggle("no-scroll", !isExpanded);

                if (!isExpanded) {
                    document.body.setAttribute("data-scroll-y", scrollY);

                    // Listen for clicks in the TOC menu to close the TOC, if we dont
                    // close the TOC then the page will not jump to the new clicked
                    // header as we would otherwise restore the scroll position from
                    // data-scroll-y
                    onEvent("#toc-menu", (e) => {
                        if (e.target.tagName !== "A") {
                            return;
                        }

                        el.setAttribute("aria-expanded", false);
                        document.body.classList.toggle("no-scroll", false);

                        document.body.removeAttribute("data-scroll-y");
                    });
                } else {
                    document.body.removeAttribute("data-scroll-y");
                    if (scrollY > 0) {
                        window.scrollTo(0, scrollY);
                    }
                }
            })
        );
    } else {
        tocToggle.removeAttribute("aria-haspopup");
        tocToggle.removeAttribute("aria-controls");
        tocToggle.removeAttribute("aria-expanded");
    }
}

/**
 * Checks the current screen size and adjust aria-expanded on the main menu accordingly
 */
function checkScreenSize() {
    currentScreenSize = screenSizes.sm;

    let viewportWidth = window.screen.width;
    try {
        viewportWidth = window.visualViewport.width;
    } catch {
        // ignore
    }

    for (const [, screenWidth] of Object.entries(screenSizes)) {
        if (viewportWidth <= screenWidth) {
            currentScreenSize = screenWidth;
            break;
        }
    }

    deviceSupportsHover = window.matchMedia("(hover:hover)").matches;

    // Re-init state & listeners if screen is resized
    window.addEventListener("resize", init);
    eventListeners.push(() => window.removeEventListener("resize", init));
}

/**
 * Init all state & listeners
 */
function init() {
    checkScreenSize();
    addMenuListeners();
}

if (document.readyState === "complete" || document.readyState === "loaded") {
    init();
} else {
    window.addEventListener("DOMContentLoaded", init);
}
