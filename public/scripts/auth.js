document.addEventListener("DOMContentLoaded", function () {
    function waitForCognito() {
        if (typeof AmazonCognitoIdentity !== "undefined") {
            console.log("✅ AmazonCognitoIdentity is available!");

            // Initialize Cognito User Pool
            const poolData = {
                UserPoolId: 'us-west-2_8hulspS50',
                ClientId: 'r04vvdnm1c5god3hak36d588c'
            };

            const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
            
            function loginUser(email, password) {
                const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
                    Username: email,
                    Password: password
                });

                const userData = {
                    Username: email,
                    Pool: userPool
                };

                const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

                cognitoUser.authenticateUser(authenticationDetails, {
                    onSuccess: function (result) {
                        const accessToken = result.getAccessToken().getJwtToken();
                        localStorage.setItem('accessToken', accessToken);
                        localStorage.setItem('userEmail', email);
                        window.location.href = `main.html?user=${encodeURIComponent(email)}`;
                    },
                    onFailure: function (err) {
                        console.error("❌ Login failed:", err);
                        alert(err.message || JSON.stringify(err));
                    }
                });
            }


            // Attach login function to form
            const loginForm = document.getElementById("signin-form");
            if (loginForm) {
                loginForm.addEventListener("submit", function (event) {
                    event.preventDefault();
                    const email = document.getElementById("email").value;
                    const password = document.getElementById("password").value;
                    loginUser(email, password);
                });
            }
        } else {
            console.warn("⚠ Waiting for AmazonCognitoIdentity to load...");
            setTimeout(waitForCognito, 500);
        }
    }

    waitForCognito();
});
