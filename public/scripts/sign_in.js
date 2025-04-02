document.getElementById("signin-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    console.log(email + " ====  ==== " + password)

    fetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" }
    })
        .then(async res => {
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            return data;
        })
        .then(data => {
            if (data.message === "NEW_PASSWORD_REQUIRED") {
                localStorage.setItem("userEmail", email);
                localStorage.setItem("userAttributes", JSON.stringify(data.userAttributes));
                localStorage.setItem("sessionToken", data.session);
                window.location.href = "reset_password.html";
            } else {
                localStorage.setItem("user_id", data.user_id);
                // console.log(data.user_details)
                localStorage.setItem("user_location", data.user_details.user_city)
                // alert("✅ Login successful!");

                Swal.fire({
                    icon: "success",
                    title: "Login Successful!",
                    text: "You have successfully logged in.",
                    timer: 2000, // Auto close after 2 seconds
                    showConfirmButton: false
                }).then(() => {
                    const redirectUrl = localStorage.getItem("redirect_after_login");
                    if (redirectUrl) {
                        localStorage.removeItem("redirect_after_login");
                        window.location.href = redirectUrl; // Redirect back to the previous page
                    } else {
                        window.location.href = "/"; // Default home page
                    }
                });

                // window.location.href = "/";
            }
        })
        .catch(err => {
            console.error("Login error:", err.message);
            alert("❌ " + err.message);
        });
});