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
        const response = await fetch(
            `${process.env.BACKEND_URL}/enum_modules`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

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
        const response = await fetch(
            `${process.env.BACKEND_URL}/enum_verdicts`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const responseData = await response.json();
        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getActions(req, res) {
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

async function updateActions(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(
            `${process.env.BACKEND_URL}/actions/update`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(req.body),
            }
        );

        const responseData = await response.json();
        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function toggleModule(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(
            `${process.env.BACKEND_URL}/enum_modules/update`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(req.body),
            }
        );

        const responseData = await response.json();
        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getBlacklistFields(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/fields_enum`, {
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

async function getBlacklists(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/blacklist`, {
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

async function addToBlacklist(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(
            `${process.env.BACKEND_URL}/blacklist/add`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(req.body),
            }
        );

        const responseData = await response.json();
        return res.status(response.status).json(responseData);
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

async function removeFromBlacklist(req, res) {
    // Get the token from cookies
    const token = req.cookies.access_token;
    try {
        const response = await fetch(
            `${process.env.BACKEND_URL}/blacklist/delete`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(req.body),
            }
        );

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
    getActions,
    updateActions,
    toggleModule,
    getBlacklistFields,
    getBlacklists,
    addToBlacklist,
    removeFromBlacklist
};
