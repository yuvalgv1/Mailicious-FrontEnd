const express = require("express");
const router = express.Router();

// Set controllers
const usersController = require("../controllers/users");

// User controller
// TODO: Auto skip loggin when token valid
router.get("/login", usersController.isLoggedIn, usersController.loginForm);
router.post("/login", usersController.login);
router.get("/logout", usersController.logout);
router.get("/", usersController.isLoggedIn, usersController.home);

module.exports = router;
