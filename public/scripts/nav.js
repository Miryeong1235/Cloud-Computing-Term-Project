// to be included in the head of all pages that need the navigation bar
document.addEventListener("DOMContentLoaded", function () {
    // fetch("nav.html")
    fetch("/nav.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("navbar-container").innerHTML = data;
            updateNavbar();
        })
        .catch(error => console.error("Error loading navigation:", error));
});

function updateNavbar() {
    const userId = localStorage.getItem("user_id");
    const profileNavItem = document.querySelector(".nav-link[href='/user_profile.html']").parentElement;
    const listingButton = document.querySelector(".btn-login[onclick*='add_item.html']");
    const loginButton = document.querySelector(".btn-login[onclick*='sign_up.html']");
    // const heroLoginBtn = document.getElementById("hero-login-btn");

    // Create logout button
    const logoutButton = document.createElement("button");
    logoutButton.className = "btn btn-login";
    logoutButton.textContent = "Logout";
    logoutButton.onclick = function () {
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_location");
        window.location.href = "/index.html"
        // window.location.reload(); // Refresh to apply changes
    };

    if (userId) {
        // User is logged in
        profileNavItem.style.display = "block";
        listingButton.style.display = "inline-block";

        // if (heroLoginBtn) {
        //     heroLoginBtn.style.display = "none";
        // }
        loginButton.replaceWith(logoutButton); // Replace login/signup with logout
    } else {
        // User is not logged in
        profileNavItem.style.display = "none";
        listingButton.style.display = "none";

        // if (heroLoginBtn) {
        //     heroLoginBtn.style.display = "inline-block";
        // }
    }
}