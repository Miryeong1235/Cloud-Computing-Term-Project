let listings = []; // Store all listings
// import { displayListingCard } from './all_listings.js';

document.addEventListener('DOMContentLoaded', async () => {

    const categoryMap = {
        "all_categories": "all_categories",
        "electronics_appliances": "Electronics & Appliances",
        "furniture": "Furniture",
        "home_garden": "Home & Garden",
        "baby_kids": "Baby & Kids",
        "women_fashion": "Women's Fashion",
        "men_fashion": "Men's Fashion",
        "health_beauty": "Health & Beauty",
        "sports_outdoors": "Sports & Outdoors",
        "games_hobbies": "Games & Hobbies",
        "books_music": "Books & Music",
        "pet_supplies": "Pet Supplies",
        "vehicles_parts": "Vehicles & Parts",
        "others": "Other",
    };

    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category") || "all_categories";
    const radioButton = document.getElementById(categoryParam);

    try {
        const response = await fetch(`http://localhost:3000/listings`);
        // const response = await fetch(`http://35.90.254.135:3000/listings`);
        if (!response.ok) throw new Error("Failed to fetch listing");

        listings = await response.json();
        console.log("Listings:", listings);

        if (radioButton) {
            radioButton.checked = true;
        }
        updateDisplayedListings(categoryParam);


    } catch (error) {
        console.error("❌ Error loading listing:", error);
    }

    document.querySelectorAll('input[name="category"]').forEach(input => {
        input.addEventListener('change', () => {
            updateDisplayedListings(input.id);
            updateURL(input.id); // Update URL
        });
    });

    document.getElementById('search-button').addEventListener('click', () => {
        const selectedCategory = document.querySelector('input[name="category"]:checked');
        const categoryId = selectedCategory ? selectedCategory.id : "all_categories";
        updateDisplayedListings(categoryId);
        updateURL(categoryId); // Update URL
    });

    document.getElementById('activeListings').addEventListener('change', () => {
        const selectedCategory = document.querySelector('input[name="category"]:checked');
        const categoryId = selectedCategory ? selectedCategory.id : "all_categories";
        updateDisplayedListings(categoryId); // Reapply the filter with category
    });

    document.getElementById('clear-search-button').addEventListener('click', () => {
        document.getElementById('search-bar').value = ""; // Clear search input
        document.getElementById("all_categories").checked = true;
        updateURL("all_categories"); // Reset category in the URL
        updateDisplayedListings("all_categories"); // Show all listings
    });

    function updateURL(selectedId) {
        const newURL = new URL(window.location);
        newURL.searchParams.set("category", selectedId);
        window.history.pushState({}, "", newURL); // Update URL without refreshing
    }



    function updateDisplayedListings(selectedId) {
        // const selectedId = document.querySelector('input[name="category"]:checked').id;
        const listingsContainer = document.getElementById("listings-go-here");
        console.log("🔍 Clearing previous listings in updateDisplayedListings...");
        listingsContainer.innerHTML = ""; // Clear listings before updating

        const searchInput = document.getElementById('search-bar');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        const showFreeOnly = document.getElementById('activeListings').checked; // Check if "Show free listings only" is checked

        let filteredListings = categoryMap[selectedId] === "all_categories"
            ? listings // Show all listings
            : listings.filter(item => item.listing_category === categoryMap[selectedId]);

        if (searchTerm) {
            filteredListings = filteredListings.filter(item =>
                item.listing_name.toLowerCase().includes(searchTerm) ||
                item.listing_description.toLowerCase().includes(searchTerm)
            );
        }

        // Filter based on "Show free listings only" checkbox
        if (showFreeOnly) {
            filteredListings = filteredListings.filter(item => item.listing_isFree === true);
        }

        console.log("Filtered Listings:", filteredListings);
        displayListings(filteredListings);
    }

    // Function to display listings
    function displayListings(filteredListings) {
        const listingsContainer = document.getElementById("listings-go-here");
        console.log("🔍 Clearing previous listings in display listings...");
        listingsContainer.innerHTML = ""; // Clear previous listings

        if (filteredListings.length === 0) {
            console.log("⚠️ No listings found");
            listingsContainer.innerHTML = "<p>No listings found</p>";
            return;
        } else {
            const currentUserId = localStorage.getItem("user_id");
            filteredListings.forEach(async listing => {
                try {
                    const user_response = await fetch(`http://localhost:3000/user/${listing.user_id}`);
                    if (!user_response.ok) throw new Error("Failed to fetch user");

                    const user = await user_response.json();
                    const seller = `${user.user_fname} ${user.user_lname}`;
                    if ((!currentUserId || currentUserId !== user.user_id) &&
                        listing.listing_isAvailable === true) {
                        displayListingCard(listing, seller);
                    }
                } catch (error) {
                    console.error("❌ Error fetching user data:", error);
                }
            });
        }
    }
});

function displayListingCard(listing, seller) {
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
