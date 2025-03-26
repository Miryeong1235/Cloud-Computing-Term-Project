let listings = []; // Store all listings
import { displayListingCard } from './all_listings.js';

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

    try {
        const response = await fetch(`http://localhost:3000/listings`);
        if (!response.ok) throw new Error("Failed to fetch listing");

        listings = await response.json();
        console.log("Listings:", listings);
        // displayListings(listings.slice(0, 12)); // Initially show first 12 listings
        updateDisplayedListings(categoryParam);

        // setupCategoryFilter(listings); // Set up category filter logic

    } catch (error) {
        console.error("❌ Error loading listing:", error);
    }

    document.querySelectorAll('input[name="category"]').forEach(input => {
        input.addEventListener('change', updateDisplayedListings);
    });

    document.getElementById('search-button').addEventListener('click', updateDisplayedListings);


    function updateDisplayedListings(selectedId) {
        // const selectedId = document.querySelector('input[name="category"]:checked').id;

        const searchInput = document.getElementById('search-bar');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

        let filteredListings = categoryMap[selectedId] === "all_categories"
            ? listings // Show all listings
            : listings.filter(item => item.listing_category === categoryMap[selectedId]);

        if (searchTerm) {
            filteredListings = filteredListings.filter(item =>
                item.listing_name.toLowerCase().includes(searchTerm) ||
                item.listing_description.toLowerCase().includes(searchTerm)
            );
        }

        console.log("Filtered Listings:", filteredListings);
        displayListings(filteredListings.slice(0, 12));
    }

    // Function to display listings
    function displayListings(filteredListings) {
        const listingsContainer = document.getElementById("listings-go-here");
        listingsContainer.innerHTML = ""; // Clear previous listings

        if (filteredListings.length === 0) {
            listingsContainer.innerHTML = "<p>No listings found</p>";
        } else {
            filteredListings.forEach(listing => {
                displayListingCard(listing);
            });
        }
    }
});


