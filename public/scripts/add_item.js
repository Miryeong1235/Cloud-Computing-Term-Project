document.addEventListener('DOMContentLoaded', function () {

    const submitForm = document.getElementById('submit-form');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('listing-photo');
    const fileNameDisplay = document.getElementById('file-name');
    let selectedFiles = [];

    // Click to trigger file input
    dropZone.addEventListener('click', () => fileInput.click());

    // File selected manually
    fileInput.addEventListener('change', () => {
        selectedFiles = [...fileInput.files];
        updateFileDisplay();
    });

    // Drag over
    ['dragenter', 'dragover'].forEach(event => {
        dropZone.addEventListener(event, e => {
            e.preventDefault();
            dropZone.classList.add('dragging');
        });
    });

    // Drag leave
    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, e => {
            e.preventDefault();
            dropZone.classList.remove('dragging');
        });
    });

    // Drop files
    dropZone.addEventListener('drop', e => {
        selectedFiles = [...e.dataTransfer.files];
        fileInput.files = e.dataTransfer.files; // Sync with input
        updateFileDisplay();
    });

    function updateFileDisplay() {
        fileNameDisplay.textContent = selectedFiles.length
            ? selectedFiles.map(f => f.name).join(', ')
            : '';
    }

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
        // formData.append("image", listingPhoto); // Append image file
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

        selectedFiles.forEach((file, index) => {
            formData.append("images", file); // Name must match backend
        });

        try {
            const response = await fetch("http://localhost:3000/listings", {
            // const response = await fetch("http://35.90.254.135:3000/listings", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Failed to add listing");

            const result = await response.json();
            // alert("✅ Listing added successfully!");
            // window.location.href = "user_profile.html";
            Swal.fire({
                title: "Noice!",
                text: "✅ Listing added successfully!",
                imageUrl: "/images/noice.jpg",
                imageWidth: 400,
                imageHeight: 300,
                imageAlt: "Custom image"
            }).then(() => {
                window.location.href = "user_profile.html";
            })
            
        } catch (error) {
            console.error("❌ Error:", error);
            alert("Failed to add listing.");
        }

        // for (let i = 0; i < listingPhoto.length; i++) {
        //     formData.append("listing_photo", listingPhoto[i]);
        // }

        // fetch("http://localhost:3000/listings", {
        //     method: "POST",
        //     body: formData
        // })
        //     .then(response => {
        //         console.log("Response received:", response);


        //         if (!response.ok) {
        //             throw new Error("Failed to create listing.");
        //         }

        //         return response.json();
        //     })
        //     .then(result => {
        //         console.log("✅ Listing created:", result);
        //         alert("Listing successfully added!");

        //         // Redirect to user profile page
        //         window.location.href = "user_profile.html";
        //     })
        //     .catch(error => {
        //         console.error("❌ Error:", error);
        //         alert("Error adding listing.");
        //     });

    })



})


