$(document).ready(function () {
    let fields = [];

    function loadData() {
        $("#loading-message")
            .append(" Loading Data...")
            .append(
                $("<span/>", {
                    class: "spinner-border spinner-border-sm",
                    role: "status",
                })
            );
    }

    function removeLoading() {
        $("#loading-message").html("");
    }

    function sendSQLStatement() {
        $("#emails_table").text();
        loadData();
        let statement = "";
        if (fields.length === 0) statement = `SELECT * FROM emails`;
        else statement = `SELECT ${fields.join(",")} FROM emails`;
        $.ajax({
            url: "/search",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ query: statement }),
            success: function (response) {
                $("#error_message").text();
                setFields(response);
                buildTable(response);
            },
            error: function (res) {
                if (res.responseJSON && res.responseJSON.error) {
                    $("#error_message").text(res.responseJSON.error);
                    $("#error_message").addClass("");
                }
            },
        });
    }

    function setFields(jsonData) {
        let keysMap = new Map();

        jsonData.emails.forEach((email) => {
            Object.keys(email).forEach((key) => {
                if (!keysMap.has(key)) {
                    keysMap.set(key, true);
                }
            });
        });

        fields = Array.from(keysMap.keys());
    }

    function buildTable(data) {
        // Enter the data from the table
        $table = $("#emails_table");

        // Add headers for the table
        $table.append(
            $("<thead/>").append(
                $("<tr/>", {
                    id: "table-head-row",
                })
            )
        );
        fields.forEach((field) => {
            $("#table-head-row").append(
                $("<th/>", {
                    scope: "col",
                    text: field,
                })
            );
        });

        // Add data
        $table_body = $table.append(
            $("<tbody/>", {
                class: "table-group-divider",
            })
        );
        data.emails.forEach((email) => {
            const $row = $("<tr>");
            fields.forEach((field) => {
                $row.append($("<td>").text(email[field] || ""));
            });
            $table_body.append($row);
        });

        // Remove the loading message
        removeLoading();
    }

    sendSQLStatement();
});
