const express = require("express");
const router = express.Router();

// Set controllers
const usersController = require("../controllers/users");
const pagesController = require("../controllers/pages");
const actionsontroller = require("../controllers/actions");

// User controller
router.post("/login", usersController.login);
router.get("/logout", usersController.logout);
router.get("/user", usersController.user);

// Navigation Controller
router.get("/", usersController.isLoggedIn, pagesController.home);
router.get("/login", usersController.isLoggedIn, pagesController.loginForm);
router.get("/home", usersController.isLoggedIn, pagesController.home);
router.get("/search", usersController.isLoggedIn, pagesController.search);
router.get("/policy", usersController.isLoggedIn, pagesController.policy);
router.get("/alerts", usersController.isLoggedIn, pagesController.alerts);
router.get("/settings", usersController.isLoggedIn, pagesController.settings);

// Actions Controller
router.post("/search", actionsontroller.search);
router.get("/enum_modules", actionsontroller.modules);
router.get("/enum_verdicts", actionsontroller.verdicts);
router.get("/actions", actionsontroller.getActions);
router.post("/actions", actionsontroller.updateActions);
router.post("/modules/toggle", actionsontroller.toggleModule);

module.exports = router;
