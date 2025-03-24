const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const multer = require("multer");
const multerS3 = require("multer-s3");
const upload = multer();
require('dotenv').config();
const cors = require("cors");
const path = require("path");

app.use(cors()); // Allow frontend requests
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Serve static frontend files from "public" folder
// app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Route to serve `index.html` by default
app.get("/", (req, res) => {
    // res.sendFile(path.join(__dirname, "index.html"));
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/listings/:listing_id", (req, res) => {
    // res.sendFile(path.join(__dirname, "item_page.html"))
    res.sendFile(path.join(__dirname, "public", "item_page.html"))
})


// Configure AWS SDK (use IAM role in production, avoid hardcoding credentials)
AWS.config.update({
    region: "us-west-2", // Change to your AWS region
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Use environment variables for security
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Create DynamoDB service object
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Create S3 service object
const s3 = new AWS.S3();


// add user
const addUser = async (user) => {
    // user.user_id = uuidv4(); // Generate a unique ID
    console.log("inside add user")
    console.log(user)
    console.log(user.user_fname)

    const params = {
        TableName: "relocash_users",
        Item: {
            user_id: uuidv4(),
            user_fname: user.user_fname,
            user_lname: user.user_lname,
            user_city: user.user_city,
            user_listings: user.user_listings || [],
            user_email: user.user_email,
            user_phone: user.user_phone
        }
    };

    try {
        await dynamoDB.put(params).promise();
        console.log("User added successfully");
        return params.Item;
    } catch (error) {
        console.error("Error adding user:", error);
    }
};

// get user by ID
const getUserById = async (user_id) => {
    const params = {
        TableName: "relocash_users",
        Key: { user_id: user_id }
    };

    try {
        const data = await dynamoDB.get(params).promise();
        if (!data.Item) {
            console.log("User not found");
            return { message: "User not found" };
        }
        console.log("User retrieved:", data.Item);
        return data.Item;
    } catch (error) {
        console.error("Error retrieving user:", error);
        return { error: error.message };
    }
};

// modify user info
async function updateUserInfo(user_id, updatedFields) {
    let updateExpression = "SET";
    let expressionAttributeNames = {}
    let expressionAttributeValues = {}
    let i = 0

    for (const el in updatedFields) {
        i++;
        updateExpression += ` #attr${i} = :val${i},`;
        expressionAttributeNames[`#attr${i}`] = el;
        expressionAttributeValues[`:val${i}`] = updatedFields[el];
    }

    // Remove trailing comma
    updateExpression = updateExpression.slice(0, -1);

    const params = {
        TableName: "relocash_users",
        Key: { user_id: user_id },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "UPDATED_NEW"
    };

    try {
        const result = await dynamoDB.update(params).promise();
        console.log("User updated successfully:", result.Attributes);
        return result.Attributes;
    } catch (error) {
        console.error("Error updating user:", error);
        return { error: error.message };
    }
}

async function deleteUserById(user_id) {
    const params = {
        TableName: "relocash_users",
        Key: { user_id }
    }

    try {
        await dynamoDB.delete(params).promise();
        console.log(`User with ID ${user_id} deleted successfully`);
        return { message: `User with ID ${user_id} deleted successfully` };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { error: error.message };
    }
}

/**
 * use for listing add, remove, modify
 */

const addListing = async (listing, imageFile) => {

    const listing_id = uuidv4();
    let imageUrl = null; // default image URL

    // If an image file is provided, upload to S3
    if (imageFile) {
        const s3Params = {
            Bucket: "relocash-listings-images",
            Key: `listings/${listing_id}_${imageFile.originalname}`,
            Body: imageFile.buffer,
            ContentType: imageFile.mimetype,
            // ACL: "public-read" // Allow public access
        };
        console.log(s3Params)

        try {
            const uploadResult = await s3.upload(s3Params).promise();
            imageUrl = uploadResult.Location; // Get the S3 URL
        } catch (error) {
            console.error("Error uploading image to S3:", error);
            throw new Error("Failed to upload image");
        }
    }

    // console.log("\n after upload image file --->>>  " + imageFile + "\n")

    const params = {
        TableName: "relocash_listings",
        Item: {
            listing_id,
            user_id: listing.user_id,
            listing_name: listing.listing_name,
            listing_description: listing.listing_description,
            listing_price: listing.listing_price,
            listing_category: listing.listing_category,
            listing_isFree: listing.listing_isFree,
            listing_photo: imageUrl,
            listing_condition: listing.listing_condition,
            listing_isAvailable: true
        }
    };

    // console.log(params.Item.listing_photo)
    try {
        await dynamoDB.put(params).promise();
        console.log("✅ Listing added successfully to DynamoDB:", params.Item);
        return params.Item;

    } catch (error) {
        console.error("Error adding listing:", error);
        throw new Error("Failed to add listing to database");

    }
};

const removeListing = async (listing_id) => {
    const params = {
        TableName: "relocash_listings",
        Key: { listing_id }
    }
    try {
        await dynamoDB.delete(params).promise();
        console.log(`Listing with ID ${Listing_id} deleted successfully`);
        return { message: `Listing with ID ${Listing_id} deleted successfully` };
    } catch (error) {
        console.error("Error deleting Listing:", error);
        return { error: error.message };
    }
}

const getAllListings = async () => {
    // console.log("here in get all listings")
    const params = {
        TableName: "relocash_listings"
    }
    try {
        const data = await dynamoDB.scan(params).promise();
        // console.log(data)
        if (!data.Items || data.Items.length === 0) {
            console.log("No listings found");
            return { message: "No listings found" };
        }
        // console.log("Listings retrieved:", data.Items);
        return data.Items;
    } catch (error) {
        console.error("Error retrieving listings:", error);
        return { error: error.message };
    }
}

const getAllListingsByUserId = async (user_id) => {
    // console.log("get all listings by user ID")
    const params = {
        TableName: "relocash_listings",
        IndexName: "user_id-index", // If using a Global Secondary Index (GSI) for user_id
        KeyConditionExpression: "user_id = :user_id",
        ExpressionAttributeValues: {
            ":user_id": user_id
        }
    };

    try {
        const data = await dynamoDB.query(params).promise(); // Use query() instead of scan()
        console.log(data)
        if (!data.Items || data.Items.length === 0) {
            console.log(`No listings found for user ${user_id}`);
            return { message: `No listings found for user ${user_id}` };
        }

        console.log("User listings retrieved:", data.Items);
        return data.Items;
    } catch (error) {
        console.error("Error retrieving user listings:", error);
        return { error: error.message };
    }
};

const getListingById = async (listingId) => {
    // console.log("in the listingbyid fucntion")
    const params = {
        TableName: "relocash_listings",
        Key: {
            listing_id: listingId
        }
    }
    try {
        const result = await dynamoDB.get(params).promise();
        return result.Item || null;
    } catch (error) {
        console.error("Error fetching listing:", error);
        throw new Error("Failed to retrieve listing.");
    }

}



/**
 * register
 */
app.post("/users", async (req, res) => {
    try {
        // Get user data from request body
        const userData = req.body;

        // Call addUser function
        const newUser = await addUser(userData);

        console.log(newUser)
        // ✅ Send response
        res.status(201).json({
            message: "User added successfully",
            user: newUser.user_id
        });

    } catch (error) {
        console.error("❌ Error in POST /users:", error);
        res.status(500).json({ error: error.message });
    }
})



/**
 * get all listings endpoint
 */
app.get("/listings", async (req, res) => {
    try {
        const listings = await getAllListings();
        res.json(listings)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * get all listings by user ID endpoint
 */
app.get("/listings/user/:user_id", async (req, res) => {
    try {
        const userId = req.params.user_id;
        const listings = await getAllListingsByUserId(userId);
        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



/**
 * get a single listing by listing ID endpoint
 */
// app.get("/listings/:listing_id", async (req, res) => {
app.get("/api/listings/:listing_id", async (req, res) => {
    try {
        const listingId = req.params.listing_id
        const listing = await getListingById(listingId)

        if (!listing) {
            return res.status(404).json({ error: "Listing not found" });
        }
        // console.log(listing)
        res.json(listing)
    } catch (error) {
        console.log("error nih")
        res.status(500).json({ error: error.message });
    }
})

/**
 * posting a listing endpoint
 */
app.post("/listings", upload.single("image"), async (req, res) => {
    // console.log("In here post")
    // console.log(req.body)
    // console.log(req.file)
    try {
        const listingData = JSON.parse(req.body.listing); // Parse listing JSON
        const newListing = await addListing(listingData, req.file);
        // res.json(newListing);

        return res.status(201).json({
            message: "Listing created successfully",
            listing: newListing
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use(express.static("public"));

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));



/////////////////////////////////////////////

// // Example usage:
// addUser({
//     user_fname: "Mike",
//     user_lname: "Doe",
//     user_city: "New York",
//     user_email: "mikedoe@example.com",
//     user_phone: "123-456-7850",
//     user_balance: 100.0
// })

// getUserById("6cd307c9-d096-421b-ab69-9133175a08c6").then(user => console.log(user));

// updateUserInfo("6cd307c9-d096-421b-ab69-9133175a08c6", {
//     user_city: "Toronto",
//     user_email: "newemail@example.com"
// });

// deleteUserById("03173c81-1526-4ec0-b1e7-5cf5ea3f7498").then(response => console.log(response));

// addListing({
//     user_id: "123", // Link listing to user
//     listing_name: "Gaming Laptop",
//     listing_price: 1200.0,
//     listing_category: "Electronics",
//     listing_isFree: false,
//     listing_photo: "https://www.edmunds.com/assets/m/honda/civic/2004/oem/2004_honda_civic_sedan_ex_fq_oem_1_500.jpg", // External image
//     listing_condition: "Used - Like New"
// }).then(response => console.log(response));