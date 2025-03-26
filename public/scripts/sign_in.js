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
                alert("✅ Login successful!");
                window.location.href = "/";
            }
        })
        .catch(err => {
            console.error("Login error:", err.message);
            alert("❌ " + err.message);
        });
});