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
router.get("/settings", usersController.isLoggedIn, pagesController.settings);

// Actions Controller
router.post("/search", actionsontroller.search);
router.get("/enum_modules", actionsontroller.modules);
router.post("/enum_modules/update", actionsontroller.toggleModule);
router.get("/enum_verdicts", actionsontroller.verdicts);
router.get("/actions", actionsontroller.getActions);
router.post("/actions", actionsontroller.updateActions);
router.get("/blacklist/fields", actionsontroller.getBlacklistFields);
router.get("/blacklist", actionsontroller.getBlacklists);
router.post("/blacklist/add", actionsontroller.addToBlacklist);
router.post("/blacklist/remove", actionsontroller.removeFromBlacklist);


module.exports = router;
