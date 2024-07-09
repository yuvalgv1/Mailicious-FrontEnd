const { response } = require("express");
require("dotenv").config({ path: "../config/.env" });

// Handle user login
async function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });
        console.log(response.status);

        const data = await response.json();

        if (response.ok) {
            // Set the token as a secure cookie
            const { access_token , id } = data;
            res.cookie("access_token", access_token, {
                httpOnly: false, // Allow JavaScript access
                sameSite: "Strict", // Mitigates CSRF attacks
                maxAge: 12 * 60 * 60 * 1000, // Cookie expires in 12 hours
            });
            return res
                .status(response.status)
                .json({ id, message: "Login successful" });
        } else {
            // Invalid login credentials
            return res.status(response.status).json(data);
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Check if the user is logged in and navigate accordingly
async function isLoggedIn(req, res, next) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    const requested_path = req.originalUrl;

    try {
        // Check the validity of the token
        const response = await fetch(
            `${process.env.BACKEND_URL}/validate-token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (response.ok) {
            // Skip the login page if there's an active token
            if (requested_path === "/login") {
                return res.redirect("/");
            }
            // Forward to the requested page
            return next();
        } else {
            if (requested_path != "/login") {
                return res.send(`
                <script>
                    sessionStorage.setItem('redirect_path', '${requested_path}');
                    window.location.href = '/login';
                </script>
            `);
            } else next();
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Handle user logout
function logout(req, res) {
    req.session.destroy(() => {
        res.redirect("/login");
    });
}

// Get user data
async function user(req, res) {
    try {
        // Get user's details using its id
        const { id } = req.query;
        const token = req.cookies.access_token;
        const response = await fetch(
            `${process.env.BACKEND_URL}/user?id=${id}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    login,
    isLoggedIn,
    logout,
    user,
};
