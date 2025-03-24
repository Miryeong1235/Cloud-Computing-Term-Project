document.addEventListener('DOMContentLoaded', async () => {

    // logic here, if any

    try {
        // Fetch data from localhost
        const response = await fetch(`http://localhost:3000/listings`);
        if (!response.ok) throw new Error("Failed to fetch listing");

        listings = await response.json();
        listings.slice(0, 12).forEach(listing => {
            displayListingCard(listing);
        });

    } catch (error) {
        console.error("❌ Error loading listing:", error);
    }
})

function displayListingCard(listing) {
    //clone the new card
    let newcard = document.getElementById("postCardTemplate").content.cloneNode(true);
    //populate with title, image
    newcard.querySelector('.card-image').src = listing.listing_photo;
    newcard.querySelector('.card-title').innerHTML = listing.listing_name;
    newcard.querySelector('.card-price').innerHTML = listing.listing_price;
    newcard.querySelector('.card-desc').innerHTML = listing.listing_description;

    // ✅ Add data-id for identification
    let cardDiv = newcard.querySelector('.card');
    cardDiv.setAttribute("data-id", listing.listing_id);

    // ✅ Attach click event during creation
    cardDiv.addEventListener("click", function () {
        // console.log("inside here", listing.listing_id);
        window.location.href = `/listings/${listing.listing_id}`; // ✅ Redirects to details page
    });


    //append to the posts
    document.getElementById("listings-go-here").append(newcard);
}