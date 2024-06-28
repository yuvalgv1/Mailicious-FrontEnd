const { response } = require("express");
require("dotenv").config({ path: "../config/.env" });

// Retreive data from emails using query
async function search(req, res) {
    try {
        const query = req.body.query;
        const response = await fetch(`${process.env.BACKEND_URL}/emails`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: query }),
        });

        const responseData = await response.json();

        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    search,
};
