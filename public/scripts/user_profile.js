document.addEventListener('DOMContentLoaded', async () => {
    const user_id = localStorage.getItem("user_id");
    let listings = [];
    let location = "";

    try {
        // const listings_response = await fetch(`http://localhost:3000/listings/user/${user_id}`);
        const listings_response = await fetch(`http://34.218.51.211:3000/listings/user/${user_id}`);
        // const user_response = await fetch(`http://localhost:3000/user/${user_id}`);
        const user_response = await fetch(`http://34.218.51.211:3000/user/${user_id}`);

        if (!listings_response.ok) throw new Error("Failed to fetch listing");
        if (!user_response.ok) throw new Error("Failed to fetch user");

        const user = await user_response.json();
        location = user.user_city;
        document.querySelector('.user-name').textContent = `${user.user_fname} ${user.user_lname}`;
        document.querySelector('.user-email').textContent = user.user_email;
        document.querySelector('.user-location').textContent = user.user_city;

        listings = await listings_response.json();
        displayListings("Available", listings, location);
    } catch (error) {
        console.error("❌ Error loading listing:", error);
    }

    document.querySelectorAll('.prof-nav-link').forEach(tab => {
        tab.addEventListener('click', async (event) => {
            event.preventDefault();
            document.querySelectorAll('.prof-nav-link').forEach(link => link.classList.remove('active'));
            tab.classList.add('active');
            // displayListings(tab.textContent.trim(), listings, location);
            const filter = tab.textContent.trim();

            try {
                const listings_response = await fetch(`http://localhost:3000/listings/user/${localStorage.getItem("user_id")}`);
                // const listings_response = await fetch(`http://34.218.51.211:3000/listings/user/${localStorage.getItem("user_id")}`);
                if (!listings_response.ok) throw new Error("Failed to refetch listings");
                listings = await listings_response.json();
                displayListings(filter, listings, location);
            } catch (err) {
                console.error("Error refreshing listings on tab click:", err);
            }
        });
    });
});

function displayListings(filter, listings, location) {
    const listingsContainer = document.getElementById("listings-go-here");
    listingsContainer.innerHTML = "";

    listings.forEach(listing => {
        if ((filter === "Available" && listing.listing_isAvailable) ||
            (filter === "Sold" && !listing.listing_isAvailable) ||
            (filter === "All")) {
            displayListingCard(listing, location);
        }
    });
}

function displayListingCard(listing, location) {
    let newcard = document.getElementById("postCardTemplate").content.cloneNode(true);
    // newcard.querySelector('.card-image').src = listing.listing_photo;
    if (listing.listing_photo) {
        newcard.querySelector('.card-image').src = listing.listing_photo;
    }
    newcard.querySelector('.card-title').textContent = listing.listing_name;
    newcard.querySelector('.card-price').textContent = listing.listing_isFree ? "Free" : `$${listing.listing_price}`;
    newcard.querySelector('.card-desc').textContent = listing.listing_description;
    newcard.querySelector('.card-location').textContent = location;
    newcard.querySelector('a[href="sell_form.html"]').href = `sell_form.html?listing_id=${listing.listing_id}`;
    // newcard.querySelector('a[href="item_page.html"]').href = `item_page.html?listing_id=${listing.listing_id}`;

    let cardDiv = newcard.querySelector('.card');
    cardDiv.setAttribute("data-id", listing.listing_id);

    // Hide sell button if the item is marked as sold
    let sellBtn = newcard.querySelector('.sell-btn');
    if (!listing.listing_isAvailable) {
        sellBtn.style.display = "none"; // Hide button
    }

    // // ✅ Attach click event during creation
    // cardDiv.addEventListener("click", function () {
    //     // console.log("inside here", listing.listing_id);
    //     window.location.href = `/listings/${listing.listing_id}`; // ✅ Redirects to details page
    // });

    // ✅ Handle click to go to item page
    cardDiv.addEventListener("click", function (event) {
        // Prevent redirect if button was clicked
        if (event.target.classList.contains('mark-btn')) return;
        window.location.href = `/listings/${listing.listing_id}`;
    });

    // ✅ Toggle availability logic
    const toggleBtn = newcard.querySelector('.mark-btn');
    toggleBtn.textContent = listing.listing_isAvailable ? "Mark as Sold" : "Mark as Available";
    toggleBtn.addEventListener("click", async (e) => {
        e.stopPropagation(); // prevent bubbling to card click

        try {
            // const response = await fetch(`http://localhost:3000/listings/${listing.listing_id}/toggle-availability`, {
            const response = await fetch(`http://34.218.51.211:3000/listings/${listing.listing_id}/toggle-availability`, {
                method: "PATCH"
            });
            console.log(response)

            if (!response.ok) throw new Error("Failed to toggle listing");


            // const listings_response = await fetch(`http://localhost:3000/listings/user/${localStorage.getItem("user_id")}`);
            const listings_response = await fetch(`http://34.218.51.211:3000/listings/user/${localStorage.getItem("user_id")}`);
            const listings = await listings_response.json();

            const activeFilter = document.querySelector('.prof-nav-link.active').textContent.trim();
            displayListings(activeFilter, listings, location);
        } catch (err) {
            console.error("Toggle error:", err);
            alert("❌ Failed to toggle listing status");
        }
    });

    document.getElementById("listings-go-here").appendChild(newcard);
}
