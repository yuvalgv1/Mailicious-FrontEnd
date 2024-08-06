const { response } = require("express");
require("dotenv").config({ path: "../config/.env" });

async function search(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/search`, {
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

async function modules(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/enum_modules`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const responseData = await response.json();
        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function verdicts(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/enum_verdicts`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const responseData = await response.json();
        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function actions(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/actions`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const responseData = await response.json();
        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    search,
    modules,
    verdicts,
    actions
};
