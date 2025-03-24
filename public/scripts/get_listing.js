document.addEventListener('DOMContentLoaded', () => {
    // console.log("in get listing")
    const pathSegments = window.location.pathname.split("/");
    const listingId = pathSegments[pathSegments.length - 1];
    console.log("listing ID >>>>" + listingId)


    // fetch(`http://localhost:3000/listings/${listingId}`, {
    fetch(`http://localhost:3000/api/listings/${listingId}`, {
        method: "GET",
    })
        .then(response => {
            // console.log("Response received:", response);


            if (!response.ok) {
                throw new Error("Failed to create listing.");
            }

            return response.json();
        })
        .then(listing => {

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
            // alert("Error adding listing.");
        })


})