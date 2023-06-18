// @license magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt MIT

// When the user scrolls
window.onscroll = function() {
    showButton();
};

// Shows or hides the scroll button
function showButton() {
    // Get the scroll button
    const scrollButton = document.getElementById("scroll-button");
    // When the user scrolls down, make the scroll button visible
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
        scrollButton.style.display = "block";
    }
    // When the user is as the top of the page, hide the scroll button
    else {
        scrollButton.style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the page
function scrollUp() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
