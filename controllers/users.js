require("dotenv").config({ path: "../config/.env" });

// Render the login form
function loginForm(req, res) {
    res.render("login", { layout: false });
}

// Handle user login
async function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ error: "Username and password are required" });
    }
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/login`, {
            method: req.method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Set the token as a secure cookie
            const { token, id } = data;
            res.cookie("authToken", token, {
                httpOnly: true, // Prevents JavaScript access
                //secure: true,      // Ensures the cookie is only sent over HTTPS. For now we don't have HTTPS
                sameSite: "Strict", // Mitigates CSRF attacks
                maxAge: 12 * 60 * 60 * 1000, // Cookie expires in 12 hours
            });
            return res
                .status(response.status)
                .json({ id, message: "Login successful"});
        } else {
            // Invalid login credentials
            return res.status(response.status).json(data);
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Check if the user is logged in
async function isLoggedIn(req, res, next) {
    // Get the token from cookies
    const token = req.cookies.authToken;
    const requested_path = req.originalUrl;

    try {
        // Check the validity of the token
        const response = await fetch(`${process.env.BACKEND_URL}/token`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`
            }
        });

        if (response.ok) {
            // Add the

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

// Render the home page
function home(req, res) {
    res.render("home");
}

// Handle user logout
function logout(req, res) {
    req.session.destroy(() => {
        res.redirect("/login");
    });
}

module.exports = {
    loginForm,
    login,
    isLoggedIn,
    home,
    logout,
};
