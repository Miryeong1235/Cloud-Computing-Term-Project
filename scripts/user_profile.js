document.addEventListener('DOMContentLoaded', async () => {

    // logic here, if any
    const user_id = localStorage.getItem("user_id");

    try {
        // Fetch data from localhost
        const response = await fetch(`http://localhost:3000/listings/user/${user_id}`);
        if (!response.ok) throw new Error("Failed to fetch listing");

        listings = await response.json();
        listings.forEach(listing => {
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
    //append to the posts
    document.getElementById("listings-go-here").append(newcard);
}