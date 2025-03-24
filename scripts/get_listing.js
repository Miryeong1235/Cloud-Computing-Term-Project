document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search)
    const listingId = urlParams.get('id')


    fetch(`http://localhost:3000/listings/57fafdcc-2562-44c1-86a9-e4e1c3bb340f`, {
        method: "GET",
    })
        .then(response => {
            console.log("Response received:", response);


            if (!response.ok) {
                throw new Error("Failed to create listing.");
            }

            return response.json();
        })
        .then(listing => {
            console.log("✅ Listing received:", listing);

            // Update UI with listing data
            document.querySelector("h2").textContent = listing.listing_name;
            document.querySelector(".item-category").textContent = listing.listing_category;
            document.querySelector("h3").textContent = `$${listing.listing_price}`;
            document.querySelector("p:nth-of-type(2)").textContent = listing.listing_description;
            document.querySelector("strong + span").textContent = listing.listing_condition;

            // Update Image Carousel
            const carouselInner = document.querySelector(".carousel-inner");
            carouselInner.innerHTML = `
                <div class="carousel-item active">
                    <img src="${listing.listing_photo}" class="d-block w-100" alt="${listing.listing_name}">
                </div>
            `;
        })
        .catch(error => {
            console.error("❌ Error:", error);
            alert("Error adding listing.");
        })


})