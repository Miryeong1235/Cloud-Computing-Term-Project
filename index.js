const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const multer = require("multer");
const multerS3 = require("multer-s3");
// const upload = multer();
require('dotenv').config();
const cors = require("cors");
const path = require("path");
const session = require('express-session');
const { Issuer, generators } = require('openid-client');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
global.fetch = require('node-fetch'); // Required for cognito sdk in Node

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

app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign_in.html'));
});



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


/**
 * Amazon cognito setup
 */

let client;
// Initialize OpenID Client
async function initializeClient() {
    const issuer = await Issuer.discover('https://cognito-idp.us-west-2.amazonaws.com/us-west-2_RLe1YK7Me');
    client = new issuer.Client({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uris: ['http://localhost:3000/callback'],
        response_types: ['code']
    });
};
initializeClient().catch(console.error);

const checkAuth = (req, res, next) => {
    if (!req.session.userInfo) {
        req.isAuthenticated = false;
    } else {
        req.isAuthenticated = true;
    }
    next();
};

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: false
}));

app.get('/', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", 'index.html'));
});


// app.get('/login', (req, res) => {
//     const nonce = generators.nonce();
//     const state = generators.state();

//     req.session.nonce = nonce;
//     req.session.state = state;

//     const authUrl = client.authorizationUrl({
//         scope: 'phone openid email',
//         state: state,
//         nonce: nonce,
//     });

//     res.redirect(authUrl);
// });

// // Helper function to get the path from the URL. Example: "http://localhost/hello" returns "/hello"
// function getPathFromURL(urlString) {
//     try {
//         const url = new URL(urlString);
//         return url.pathname;
//     } catch (error) {
//         console.error('Invalid URL:', error);
//         return null;
//     }
// }

// app.get(getPathFromURL('http://localhost:3000/callback'), async (req, res) => {
//     try {
//         const params = client.callbackParams(req);
//         const tokenSet = await client.callback(
//             'http://localhost:3000/callback',
//             params,
//             {
//                 nonce: req.session.nonce,
//                 state: req.session.state
//             }
//         );

//         const userInfo = await client.userinfo(tokenSet.access_token);
//         req.session.userInfo = userInfo;

//         res.redirect('/');
//     } catch (err) {
//         console.error('Callback error:', err);
//         res.redirect('/');
//     }
// });

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    const logoutUrl = `${process.env.USER_POOL_DOMAIN}/logout?client_id=vgpjgm260mmh3eb2pk73ht2qt&logout_uri=${process.env.LOGOUT_URI}`;
    res.redirect(logoutUrl);
});


app.get('/check-session', (req, res) => {
    console.log('Session Info:', req.session.userInfo); // Check session information
    res.send('Check your console for session information');
});


// Create a Cognito User Pool instance
const poolData = {
    UserPoolId: process.env.USER_POOL_ID, // e.g. us-west-2_abc123
    ClientId: process.env.CLIENT_ID        // from your Cognito app client
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// amazon cognito create user
// Handle user register
app.post('/register', (req, res) => {
    const { user_fname, user_lname, user_email, user_phone, user_location, password } = req.body;
    // console.log(req.body)
    // console.log(user_location)

    const attributeList = [
        new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "given_name", Value: user_fname }),
        new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "family_name", Value: user_lname }),
        new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "phone_number", Value: user_phone }),
        // new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "custom:location", Value: location }) // custom attribute in Cognito
    ];

    // console.log("Signup values:", { email, password, attributeList });

    userPool.signUp(user_email, password, attributeList, null, async (err, result) => {
        if (err) {
            console.error("❌ Cognito signup error:", err);
            return res.status(400).json({ error: err.message || "Signup failed" });
        }

        const cognitoUser = result.user;
        const user_id = result.userSub;
        console.log("✅ User registered in Cognito:", cognitoUser.getUsername());


        // Also add user to DynamoDB for app use
        const newUser = await addUser({
            user_id,
            user_fname,
            user_lname,
            user_email,
            user_phone,
            user_city: user_location,
        });

        res.status(201).json({
            message: "User registered successfully. Please confirm your account via code.",
            user_id: newUser.user_id,
            user_location,
            redirectTo: "/confirm.html"
        });
    });
});

// amazon cognito login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const userData = {
        Username: email,
        Pool: userPool
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: email,
        Password: password
    });

    cognitoUser.authenticateUser(authDetails, {
        onSuccess: async (result) => {
            // alert("✅ Login successful!");
            // window.location.href = "index.html";

            // const accessToken = result.getAccessToken().getJwtToken();
            const idToken = result.getIdToken().getJwtToken();

            const payload = JSON.parse(
                Buffer.from(idToken.split('.')[1], 'base64').toString('utf-8')
            );

            const userSub = payload.sub; // get the user sub which is the user_id

            try {
                const userDetails = await getUserById(userSub); // ✅ Await the user

                console.log("user details --->>  " + JSON.stringify(userDetails))

                if (userDetails.error) {
                    return res.status(500).json({ error: userDetails.error });
                }

                res.status(200).json({
                    message: "LOGIN_SUCCESS",
                    user_id: userSub,
                    user_details: userDetails // ✅ Send user info to frontend
                });
            } catch (err) {
                console.error("Failed to retrieve user:", err);
                res.status(500).json({ error: "Failed to fetch user details" });
            }

            // res.status(200).json({
            //     message: "LOGIN_SUCCESS",
            //     user_id: userSub
            // });
        },
        onFailure: (err) => {
            console.error('❌ Login failed:', err);
            res.status(401).json({ error: err.message || 'Login failed' });
        },
        newPasswordRequired: function (userAttributes, requiredAttributes) {
            console.log("⚠️ New password is required.");
            return res.status(403).json({
                message: "NEW_PASSWORD_REQUIRED",
                userAttributes,
                session: cognitoUser.Session
            });
        }
    });
});



////////////////////////////////


// add user
const addUser = async (user) => {
    // user.user_id = uuidv4(); // Generate a unique ID

    const params = {
        TableName: "relocash_users",
        Item: {
            // user_id: uuidv4(),
            user_id: user.user_id,
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
        // console.log("User retrieved:", data.Item);
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
    // console.log("here is location -->>>  " + listing.listing_location)
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
            listing_isAvailable: true,
            listing_location: listing.listing_location
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
        // console.log(data)
        if (!data.Items || data.Items.length === 0) {
            console.log(`No listings found for user ${user_id}`);
            return { message: `No listings found for user ${user_id}` };
        }

        // console.log("User listings retrieved:", data.Items);
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

const soldListingById = async (listingId) => {
    const listing = await getListingById(listingId)
    if (!listing) {
        throw new Error("Listing not found");
    }

    const newAvailability = !listing.listing_isAvailable;

    const params = {
        TableName: "relocash_listings",
        Key: { listing_id: listingId },
        UpdateExpression: "SET listing_isAvailable = :newVal",
        ExpressionAttributeValues: {
            ":newVal": newAvailability
        },
        ReturnValues: "UPDATED_NEW"
    };

    try {
        const result = await dynamoDB.update(params).promise();
        // console.log("Listing availability toggled:", result.Attributes);
        return result.Attributes;
    } catch (error) {
        console.error("Error toggling listing availability:", error);
        throw new Error("Failed to update listing availability.");
    }
}

/**
 * get user by id listings endpoint
 */
app.get("/user/:user_id", async (req, res) => {
    try {
        const userId = req.params.user_id;
        const user = await getUserById(userId);
        // console.log(user)
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


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
// const multiUpload = upload.array("images");
// app.post("/listings", multiUpload, async (req, res) => {
//     console.log(`multi upload --<<>>> ${multiUpload}`)
//     try {
//         const listingData = JSON.parse(req.body.listing);
//         const uploadedPhotos = [];

//         for (const file of req.files) {
//             const listing_id = uuidv4(); // Or re-use one for all files
//             const s3Params = {
//                 Bucket: "relocash-listings-images",
//                 Key: `listings/${listing_id}_${file.originalname}`,
//                 Body: file.buffer,
//                 ContentType: file.mimetype
//             };

//             const uploadResult = await s3.upload(s3Params).promise();
//             uploadedPhotos.push(uploadResult.Location);
//         }

//         const params = {
//             TableName: "relocash_listings",
//             Item: {
//                 listing_id: uuidv4(),
//                 user_id: listingData.user_id,
//                 listing_name: listingData.listing_name,
//                 listing_description: listingData.listing_description,
//                 listing_price: listingData.listing_price,
//                 listing_category: listingData.listing_category,
//                 listing_isFree: listingData.listing_isFree,
//                 listing_photo: uploadedPhotos[0], // Primary image
//                 listing_photos: uploadedPhotos,   // All images
//                 listing_condition: listingData.listing_condition,
//                 listing_isAvailable: true,
//                 listing_location: listingData.listing_location
//             }
//         };

//         await dynamoDB.put(params).promise();
//         res.status(201).json({ message: "Listing created successfully", listing: params.Item });

//     } catch (error) {
//         console.error("Upload error:", error);
//         res.status(500).json({ error: error.message });
//     }
// });
// app.post("/listings", upload.single("image"), async (req, res) => {
//     try {
//         const listingData = JSON.parse(req.body.listing); // Parse listing JSON
//         const newListing = await addListing(listingData, req.file);

//         return res.status(201).json({
//             message: "Listing created successfully",
//             listing: newListing
//         });

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

const fs = require("fs");
// const path = require("path");
const os = require("os");
// const uploadDir = "/efs/uploads";
// const uploadDir = path.join(__dirname, 'uploads');
// app.use('/uploads', express.static('/home/ec2-user/efs/uploads'));

// // Ensure the upload directory exists
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }
// Path to EFS-mounted upload directory
const uploadDir = "/home/ec2-user/efs/uploads";

// Make the EFS upload directory if not exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from the upload directory
app.use('/uploads', express.static(uploadDir));

// Update multer to store in memory (no disk usage before saving to EFS)
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/listings", upload.array("images"), async (req, res) => {
    try {
        const listingData = JSON.parse(req.body.listing);
        const uploadedPhotos = [];

        for (const file of req.files) {
            const listing_id = uuidv4();
            const filename = `${listing_id}_${file.originalname}`;
            const filePath = path.join(uploadDir, filename);

            fs.writeFileSync(filePath, file.buffer); // Save to EFS

            uploadedPhotos.push(`/uploads/${filename}`); // Save relative path
        }

        const params = {
            TableName: "relocash_listings",
            Item: {
                listing_id: uuidv4(),
                user_id: listingData.user_id,
                listing_name: listingData.listing_name,
                listing_description: listingData.listing_description,
                listing_price: listingData.listing_price,
                listing_category: listingData.listing_category,
                listing_isFree: listingData.listing_isFree,
                listing_photo: uploadedPhotos[0],
                listing_photos: uploadedPhotos,
                listing_condition: listingData.listing_condition,
                listing_isAvailable: true,
                listing_location: listingData.listing_location
            }
        };

        await dynamoDB.put(params).promise();
        res.status(201).json({ message: "Listing created successfully", listing: params.Item });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
    }
});



/**
 * edit listing availability endpoint
 */
app.patch("/listings/:listing_id/toggle-availability", async (req, res) => {
    const listingId = req.params.listing_id;

    try {
        const updatedListing = await soldListingById(listingId);
        res.json({
            message: "Listing availability updated",
            updated: updatedListing
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const addShipingInfo = async (shipping) => {
    const params = {
        TableName: "relocash_shippings",
        Item: {
            shipping_address1: shipping.shipping_address1,
            shipping_address2: shipping.shipping_address1 || null,
            shipping_city: shipping.shipping_city,
            shipping_postal_code: shipping.shipping_postal_code,
            shipping_province: shipping.shipping_province,
            shipping_country: shipping.shipping_country
        }
    }
    try {
        await dynamoDB.put(params).promise();
        console.log("User added successfully");
        return params.Item;
    } catch (error) {
        console.error("Error adding user:", error);
    }
}


/**
 * add shipping information
 */
app.post("/shippings", async (req, res) => {
    try {
        const shippingData = req.body;

        const newShipping = await addShipingInfo(shippingData)

        res.status(201).json({
            message: "shipping added successfully",
            shipping: newShipping.shipping_id
        })

    } catch {
        console.error("❌ Error in POST /shippings", error);
        res.status(500).json({ error: error.message });
    }
})


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