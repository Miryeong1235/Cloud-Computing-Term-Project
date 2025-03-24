// to be included in the head of all pages that need the navigation bar
document.addEventListener("DOMContentLoaded", function () {
    // fetch("footer.html")
    fetch("/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer-container").innerHTML = data;
        })
        .catch(error => console.error("Error loading footer:", error));
});
