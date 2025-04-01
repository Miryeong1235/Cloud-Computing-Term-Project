document.addEventListener('DOMContentLoaded', async () => {

    let listings = [];
    // logic here, if any

    try {
        // Fetch data from localhost
        const response = await fetch(`http://localhost:3000/listings`);
        // const response = await fetch(`http://35.90.254.135:3000/listings`);

        if (!response.ok) throw new Error("Failed to fetch listing");
        listings = await response.json();

        const currentUserId = localStorage.getItem("user_id");
        let displayedCount = 0;

        // listings.slice(0, 12).forEach(async listing => {
        //     const user_response = (await fetch(`http://localhost:3000/user/${listing.user_id}`));
        //     const user = await user_response.json();
        //     const seller = user.user_fname + " " + user.user_lname;
        //     displayListingCard(listing, seller);
        // });
        for (const listing of listings) {
            if (displayedCount >= 12) break;
            try {
                const user_response = await fetch(`http://localhost:3000/user/${listing.user_id}`);
                if (!user_response.ok) throw new Error("Failed to fetch user");

                const user = await user_response.json();
                const seller = `${user.user_fname} ${user.user_lname}`;

                if ((!currentUserId || currentUserId !== user.user_id) && listing.listing_isAvailable === true) {
                    displayListingCard(listing, seller);
                    displayedCount++; // ✅ Increase count when a card is displayed
                }
            } catch (error) {
                console.error("❌ Error fetching user data:", error);
            }
        }

    } catch (error) {
        console.error("❌ Error loading listing:", error);
    }
})

export function displayListingCard(listing, seller) {
    //clone the new card
    let newcard = document.getElementById("postCardTemplate").content.cloneNode(true);
    //populate with title, image
    if (listing.listing_photo) {
        newcard.querySelector('.card-image').src = listing.listing_photo;
    }
    newcard.querySelector('.card-title').innerHTML = listing.listing_name;
    // newcard.querySelector('.card-price').innerHTML = listing.listing_price;
    newcard.querySelector('.card-price').textContent = listing.listing_isFree ? "Free" : `$${listing.listing_price}`;
    newcard.querySelector('.card-desc').innerHTML = listing.listing_description;
    // newcard.querySelector('.card-seller').innerHTML = seller
    newcard.querySelector('.card-location').innerHTML = listing.listing_location;

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