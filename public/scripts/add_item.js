document.addEventListener('DOMContentLoaded', function () {

    const submitForm = document.getElementById('submit-form');
    // const listingForm = document.querySelector('form');

    submitForm.addEventListener('click', async function (event) {
        event.preventDefault();

        var listingName = document.getElementById('listing-name').value;
        var listingDescription = document.getElementById('listing-description').value;
        var listingPrice = document.getElementById('listing-price').value;
        var listingIsFree = document.getElementById('listing-isFree').checked;
        var listingCategory = document.getElementById('listing-category').value;
        var listingCondition = document.getElementById('listing-condition').value;
        var listingPhoto = document.getElementById('listing-photo').files[0]; // this ensure to get the file not just the string path


        let formData = new FormData()
        formData.append("image", listingPhoto); // Append image file
        formData.append("listing", JSON.stringify({
            user_id: localStorage.getItem("user_id"),
            listing_name: listingName,
            listing_description: listingDescription,
            listing_price: listingPrice,
            listing_category: listingCategory,
            listing_isFree: listingIsFree,
            listing_condition: listingCondition
        }));

        // try {
        // let response = await fetch("http://localhost:3000/listings", { // Replace with actual API URL if deployed
        //     method: "POST",
        //     body: formData // Send as multipart/form-data
        // });

        // console.log(response)
        // if (response.ok) {
        //     let result = await response.json();
        //     alert("Listing successfully added!");
        //     listingForm.reset(); // Clear form after submission
        //     window.location.href("user_profile.html")
        //     res
        // } else {
        //     throw new Error("Failed to create listing.");
        // }

        // } catch {
        //     console.error("Error:", error);
        //     alert("Error adding listing.");
        // }

        fetch("http://localhost:3000/listings", {
            method: "POST",
            body: formData
        })
            .then(response => {
                console.log("Response received:", response);


                if (!response.ok) {
                    throw new Error("Failed to create listing.");
                }

                return response.json();
            })
            .then(result => {
                console.log("✅ Listing created:", result);
                alert("Listing successfully added!");

                // Redirect to user profile page
                window.location.href = "user_profile.html";
            })
            .catch(error => {
                console.error("❌ Error:", error);
                alert("Error adding listing.");
            });

    })

})


