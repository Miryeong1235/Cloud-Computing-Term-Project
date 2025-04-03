document.addEventListener('DOMContentLoaded', () => {
    const pathSegments = window.location.pathname.split("/");
    const listingId = pathSegments[pathSegments.length - 1];

    fetch(`${BASE_URL}/api/listings/${listingId}`, {
        method: "GET",
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to create listing.");
            }

            return response.json();
        })
        .then(listing => {
            console.log(listing)
            document.getElementById("listing-loading").style.display = "none";
            document.getElementById("listing-info").style.display = "flex";
            const currentCategoryBreadcrumb = document.getElementById("currentCategoryBreadcrumb");
            currentCategoryBreadcrumb.textContent = listing.listing_category;

            // Update UI with listing data
            document.querySelector("h2").textContent = listing.listing_name;
            document.querySelector(".item-category").textContent = listing.listing_category;
            // document.querySelector("h3").textContent = `$ ${listing.listing_price}`;
            document.querySelector("h3").textContent = listing.listing_isFree ? "Free" : `$ ${listing.listing_price}`;
            document.querySelector("p:nth-of-type(2)").textContent = listing.listing_description;
            document.querySelector("strong + span").textContent = listing.listing_condition;

            // // Update Image Carousel
            // const carouselInner = document.querySelector(".carousel-inner");
            // carouselInner.innerHTML = `
            //     <div class="carousel-item active">
            //         <img src="${listing.listing_photo}" class="d-block w-100" alt="${listing.listing_name}">
            //     </div>
            // `;
            // Update Image Carousel
            // const photos = listing.listing_photos || [listing.listing_photo];
            const photos = listing.listing_photos && listing.listing_photos.length > 0
                ? listing.listing_photos
                : [listing.listing_photo || '/images/no_image_uploaded.jpg']; // Fallback to listing_photo or default image

            const carouselInner = document.querySelector(".carousel-inner");
            const prevBtn = document.querySelector(".carousel-control-prev");
            const nextBtn = document.querySelector(".carousel-control-next");

            carouselInner.innerHTML = ""; // Clear existing items

            photos.forEach((photoUrl, index) => {
                const item = document.createElement("div");
                item.className = `carousel-item${index === 0 ? " active" : ""}`;

                const imgContainer = document.createElement("div");
                imgContainer.className = "carousel-img-container";

                const img = document.createElement("img");
                img.src = photoUrl;
                img.alt = `${listing.listing_name} image ${index + 1}`;
                // img.className = "d-block w-100";
                img.className = "carousel-img";

                imgContainer.appendChild(img)
                item.appendChild(imgContainer);
                carouselInner.appendChild(item);
            });

            // Hide controls if only 1 image
            if (photos.length <= 1) {
                prevBtn.style.display = "none";
                nextBtn.style.display = "none";
            } else {
                prevBtn.style.display = "block";
                nextBtn.style.display = "block";
            }

            // Hide buttons if the logged-in user is the seller
            const loggedInUserId = localStorage.getItem("user_id");
            if (loggedInUserId === listing.user_id) {
                document.querySelector(".message-btn").style.display = "none"; // Message Seller
                // document.querySelector(".buy-btn").style.display = "none"; // Buy Item
            } else {
                fetch(`${BASE_URL}/user/${listing.user_id}`, {
                    method: "GET",
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error("Failed to create listing.");
                        }

                        return response.json();
                    })
                    .then(user => {
                        document.querySelector(".seller").textContent = `${user.user_fname} ${user.user_lname}`
                        // handle whatsapp
                        document.querySelector(".message-btn").addEventListener("click", () => {
                            if (!loggedInUserId) {
                                // Save the current page URL before redirecting
                                localStorage.setItem("redirect_after_login", window.location.href);

                                // Show SweetAlert and redirect to login page
                                Swal.fire({
                                    icon: "warning",
                                    title: "You need to log in",
                                    text: "Please log in to message the seller.",
                                    confirmButtonText: "Go to Login",
                                    allowOutsideClick: false
                                }).then(() => {
                                    window.location.href = "/sign_in.html";
                                });

                                return;
                            }

                            const phone = user.user_phone?.replace(/\D/g, "");
                            if (!phone) {
                                return alert("Seller phone number is not available.");
                            }

                            const message = encodeURIComponent(`Hi! I'm interested in your listing "${listing.listing_name}" on ReloCash.`);
                            const whatsappURL = `https://wa.me/${phone}?text=${message}`;

                            window.open(whatsappURL, "_blank");
                        });
                    })

            }
        })
        .catch(error => {
            console.error("❌ Error:", error);
        })
})