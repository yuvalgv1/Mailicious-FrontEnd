require('dotenv').config({ path: './config/.env' });
const path = require('path');

const express = require("express");
const app = express();

// create session for the app
const session = require('express-session');
app.use(session({
    secret: 'Mailicious',
    saveUninitialized: false,
    resave: false
}))

app.use(express.static("resources"));
// Set the views folder
const { readdirSync, statSync } = require('fs');
views = []
function exploreViews(currentPath) {
    // get all files under views
    const files = readdirSync(currentPath);

    // explore each file and folder and add only the directories to the list of views.
    files.forEach((file) => {
        const filePath = path.join(currentPath, file);
        const isDirectory = statSync(filePath).isDirectory();

        // make it recursive.
        if (isDirectory) {
            views.push(filePath);
            exploreViews(filePath);
        }
    });
}
views_path = __dirname + "\\views"
views.push(views_path);
exploreViews(views_path);
app.set("views", views);

// Route the requests
app.use(express.urlencoded({ extended: false }));
app.use("/", require("./routes/router"));

// set app listener
app.listen(process.env.PORT);