const express = require("express");
const router = express.Router();

// Set controllers
const usersController = require("../controllers/users");
const pagesController = require("../controllers/pages");

// User controller
router.post("/login", usersController.login);
router.get("/logout", usersController.logout);
router.get("/users", usersController.isLoggedIn, usersController.users);


// Pages Controller
router.get("/", usersController.isLoggedIn, pagesController.home);
router.get("/login", usersController.isLoggedIn, pagesController.loginForm);
router.get("/home", usersController.isLoggedIn, pagesController.home);
router.get("/search", usersController.isLoggedIn, pagesController.search);
router.get("/rules", usersController.isLoggedIn, pagesController.rules);
router.get("/alerts", usersController.isLoggedIn, pagesController.alerts);
router.get("/settings", usersController.isLoggedIn, pagesController.settings);

module.exports = router;
