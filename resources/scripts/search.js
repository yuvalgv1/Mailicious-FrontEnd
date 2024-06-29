$(document).ready(function () {
    let fields = [];
    let url = "/search/email";
    let data = JSON.stringify({});

    // Add loading message when waiting for the server to send the data.
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

    // Remoev the loading Data text
    function removeLoading() {
        $("#loading-message").html("");
    }

    $('#search-input').keypress(function(event) {
        if (event.which === 13 && $(this).val() != "") {
            url = "/search/text";
            data = JSON.stringify({ text: $(this).val()})
            searchData();
        }
        else if ($(this).val() == "" && url == "/search/text") {
            url = "/search/email";
            data = JSON.stringify({})
            searchData();
        }
    });

    // Send to the server a request for a new query
    function searchData() {
        $("#emails_table").text("");
        loadData();
        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json",
            data: data,
            success: function (response) {
                $("#error_message").text("");
                if (fields.length === 0) setFields(response);
                buildTable(response);
            },
            error: function (res) {
                if (res.status == 401)
                    window.location.href = "/login";
                if (res.responseJSON && res.responseJSON.error) {
                    $("#error_message").text(res.responseJSON.error);
                    $("#error_message").addClass("");
                }
                removeLoading();
            },
        });
    }

    // Convert the fields from the server
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

    searchData();
});
