require('dotenv').config({ path: '../config/.env' });

// Render the login form
function loginForm(req, res) {
    res.render("login", {});
}

// Handle user login
async function login(req, res) {
    // TODO: INTEGRATE WITH BE
    const response = await fetch(process.env.BACKEND_API + "/users");
    // TODO: just return BE response
    if (result) {
        req.session.username = username;
        return res.status(200).json({ success: true, redirect: '/' })
    } else {
        return res.status(401).json({ message: 'Username or password are incorrect' });
    }
}

// Check if the user is logged in
function isLoggedIn(req, res, next) {
    // Get the token from localStorage (or cookies)
    const token = localStorage.getItem("accessToken");
    const currentPath = window.location.pathname;

    // TODO: Add here the token check in front with BE
    if (req.session.username != null) {
        return next();
    } else {
        // TODO: Save requested location before redirecting
        res.redirect('/login');
    }
}

// Render the home page
function home(req, res) {
    res.render("home", { username: req.session.username });
}

// Handle user logout
function logout(req, res) {
    req.session.destroy(() => {
        res.redirect('/login');
    });
}


module.exports = {
    loginForm,
    login,
    isLoggedIn,
    home,
    logout
}