document.addEventListener('DOMContentLoaded', function () {

    const submitForm = document.getElementById('submit-form');
    // const listingForm = document.querySelector('form');

    // const fileInput = document.getElementById("listing-photo");
    // const dropArea = fileInput.closest(".mb-3");

    // // Drag & drop visual cue
    // ["dragenter", "dragover"].forEach(eventName => {
    //     dropArea.addEventListener(eventName, (e) => {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         dropArea.classList.add("dragging");
    //     });
    // });

    // ["dragleave", "drop"].forEach(eventName => {
    //     dropArea.addEventListener(eventName, (e) => {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         dropArea.classList.remove("dragging");
    //     });
    // });

    // // Handle dropped files
    // dropArea.addEventListener("drop", (e) => {
    //     const files = e.dataTransfer.files;
    //     if (files.length) {
    //         fileInput.files = files;
    //     }
    // });

    submitForm.addEventListener('click', async function (event) {
        event.preventDefault();

        var listingName = document.getElementById('listing-name').value;
        var listingDescription = document.getElementById('listing-description').value;
        var listingPrice = document.getElementById('listing-price').value;
        var listingIsFree = document.getElementById('listing-isFree').checked;
        var listingCategory = document.getElementById('listing-category').value;
        var listingCondition = document.getElementById('listing-condition').value;
        var listingPhoto = document.getElementById('listing-photo').files[0]; // this ensure to get the file not just the string path
        // var listingPhoto = document.getElementById('listing-photo').files; // this ensure to get the file not just the string path
        // console.log("listing photo --> " + listingPhoto)



        let formData = new FormData()
        formData.append("image", listingPhoto); // Append image file
        formData.append("listing", JSON.stringify({
            user_id: localStorage.getItem("user_id"),
            listing_name: listingName,
            listing_description: listingDescription,
            listing_price: listingPrice,
            listing_category: listingCategory,
            listing_isFree: listingIsFree,
            listing_condition: listingCondition,
            listing_location: localStorage.getItem("user_location")
        }));

        // for (let i = 0; i < listingPhoto.length; i++) {
        //     formData.append("listing_photo", listingPhoto[i]);
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


