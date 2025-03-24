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

        // ✅ Create a JSON object instead of FormData
        let userData = {
            user_fname,
            user_lname,
            user_email,
            user_phone,
            user_city
        };

        fetch("http://localhost:3000/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // ✅ Set JSON content type
            },
            body: JSON.stringify(userData) // ✅ Send JSON data
        })
            .then(response => {
                console.log("Response received:", response);

                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || "Failed to create user."); });
                }

                return response.json();
            })
            .then(result => {
                console.log("✅ New user created:", result);
                alert("New user successfully created!");

                // attach user_id in localStorage
                localStorage.setItem("user_id", result.user);

                // ✅ Redirect to the home page or user profile
                window.location.href = "index.html";
            })
            .catch(error => {
                console.error("❌ Error:", error);
                alert("Error creating new user: " + error.message);
            });
    });
});