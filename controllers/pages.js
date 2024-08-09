
// Render the login form
function loginForm(req, res) {
    res.render("login", { layout: false });
}

// Render the home page
function home(req, res) {
    res.render("home");
}

// Render the data search page
function search(req, res) {
    res.render("search")
}

// Render the data rules page
function policy(req, res) {
    res.render("policy")
}

// Render the data settings page
function settings(req, res) {
    res.render("settings")
}

module.exports = {
    loginForm,
    home,
    search,
    policy,
    alerts,
    settings
};