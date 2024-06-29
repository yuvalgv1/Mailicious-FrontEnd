const { response } = require("express");
require("dotenv").config({ path: "../config/.env" });

// Retreive data from emails using query
async function searchText(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const text = req.body.text;
        const response = await fetch(`${process.env.BACKEND_URL}/search/text`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(req.body),
        });

        const responseData = await response.json();

        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function searchEmail(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/search/email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(req.body),
        });

        const responseData = await response.json();

        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    searchText,
    searchEmail
};
