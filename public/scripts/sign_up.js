// document.addEventListener('DOMContentLoaded', () => {
//     const submitForm = document.getElementById('sign-up-submit-btn');

//     submitForm.addEventListener('click', async function (event) {
//         event.preventDefault();

//         var user_fname = document.getElementById('first_name').value;
//         var user_lname = document.getElementById('last_name').value;
//         var user_email = document.getElementById('email').value;
//         var user_phone = document.getElementById('phone').value;
//         var user_city = document.getElementById('location').value;

//         let formData = new FormData();
//         formData.append("user", JSON.stringify({
//             user_fname,
//             user_lname,
//             user_email,
//             user_phone,
//             user_city
//         }));


//         fetch("http://localhost:3000/users", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json" // ✅ Set JSON content type
//             },
//             body: formData
//         })
//             .then(response => {
//                 console.log("Response received:", response);

//                 if (!response.ok) {
//                     throw new Error("Failed to create listing.");
//                 }

//                 return response.json();
//             })
//             .then(result => {
//                 console.log("New user created:", result);
//                 alert("New user successfully created!");

//                 // Redirect to user profile page
//                 window.location.href = "index.html";
//             })
//             .catch(error => {
//                 console.error("❌ Error:", error);
//                 alert("Error create new user.");
//             });
//     })


// })

document.addEventListener('DOMContentLoaded', () => {
    const submitForm = document.getElementById('sign-up-submit-btn');

    submitForm.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent page reload

        var user_fname = document.getElementById('first_name').value;
        var user_lname = document.getElementById('last_name').value;
        var user_email = document.getElementById('email').value;
        var user_phone = document.getElementById('phone').value;
        var user_city = document.getElementById('location').value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm_password").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // ✅ Create a JSON object instead of FormData
        const userData = {
            user_fname,
            user_lname,
            user_email,
            user_phone: "+1" + user_phone,
            user_city,
            password
        };

        // fetch("http://localhost:3000/users", {
        fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // ✅ Set JSON content type
            },
            body: JSON.stringify(userData) // ✅ Send JSON data
        })

            .then(res => {
                return res.json().then(data => {
                    if (res.ok) {
                        localStorage.setItem("user_id", data.user_id);
                        alert("✅ Registration successful!");
                        window.location.href = "index.html";
                    } else {
                        alert("❌ Error: " + data.error);
                    }
                });
            })
            .catch(error => {
                console.error("Error during signup:", error);
                alert("An error occurred.");
            });
    });
});