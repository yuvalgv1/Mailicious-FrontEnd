const express = require("express");
const router = express.Router();

// Set controllers
const usersController = require("../controllers/users");
const pagesController = require("../controllers/pages");
const actionsontroller = require("../controllers/actions");

// User controller
router.post("/login", usersController.login);
router.get("/logout", usersController.logout);
router.get("/users", usersController.isLoggedIn, usersController.users);

// Navigation Controller
router.get("/", usersController.isLoggedIn, pagesController.home);
router.get("/login", usersController.isLoggedIn, pagesController.loginForm);
router.get("/home", usersController.isLoggedIn, pagesController.home);
router.get("/search", usersController.isLoggedIn, pagesController.search);
router.get("/rules", usersController.isLoggedIn, pagesController.rules);
router.get("/alerts", usersController.isLoggedIn, pagesController.alerts);
router.get("/settings", usersController.isLoggedIn, pagesController.settings);

// Actions Controller
router.post("/search", usersController.validateAction, actionsontroller.search);

module.exports = router;
