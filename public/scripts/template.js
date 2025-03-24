document.addEventListener('DOMContentLoaded', async () => {

    // logic here, if any

    try {
        // Fetch data from localhost
        const response = await fetch(`http://localhost:3000/......`);
        if (!response.ok) throw new Error("Failed to fetch listing");

        // logic here, if any

    } catch (error) {
        console.error("❌ Error loading listing:", error);
    }
})