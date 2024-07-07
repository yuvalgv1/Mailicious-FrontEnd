$(document).ready(function () {
    let fields = [];
    let visibleFields = new Set();
    let url = "/search/email";
    let send_data = JSON.stringify({});
    let table_data = "";

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

    $("#search-input").keypress(function (event) {
        if (event.which === 13 && $(this).val() != "") {
            url = "/search/text";
            send_data = JSON.stringify({ text: $(this).val() });
            searchData();
        } else if ($(this).val() == "" && url == "/search/text") {
            url = "/search/email";
            send_data = JSON.stringify({});
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
            data: send_data,
            success: function (response) {
                $("#error_message").text("");
                if (fields.length === 0) setFields(response);
                table_data = response.emails;
                buildTable(table_data);
            },
            error: function (res) {
                if (res.status == 401) window.location.href = "/login";
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
        visibleFields = new Set(fields);
        populateSortableList();
    }

    function buildTable() {
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
        visibleFields.forEach((field) => {
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
        table_data.forEach((email) => {
            const $row = $("<tr>");
            visibleFields.forEach((field) => {
                $row.append($("<td>").text(email[field] || ""));
            });
            $table_body.append($row);
        });

        // Remove the loading message
        removeLoading();
    }

    // Populate sortable list with columns
    function populateSortableList() {
        let sortableList = $("#sortable-columns");
        sortableList.empty();
        fields.forEach((field, index) => {
            let listItem = $("<li>")
                .addClass("list-group-item")
                .attr("data-index", index) // Store original index as data attribute
                .append(
                    $("<input>", { type: "checkbox", class: "checkbox-column" })
                        .prop("checked", visibleFields.has(field))
                        .change(function () {
                            // Update the temporary array based on current checkbox states
                            newVisibleFields = [];
                            sortableList
                                .find(".checkbox-column")
                                .each(function () {
                                    let fieldName = $(this)
                                        .closest("li")
                                        .find("span")
                                        .text();
                                    if ($(this).is(":checked")) {
                                        newVisibleFields.push(fieldName);
                                    }
                                });

                            // Update visibleFields to the new order
                            visibleFields = new Set(newVisibleFields);
                        })
                )
                .append($("<span>").text(field));
            sortableList.append(listItem);
        });
    }

    // Initialize sortable
    $("#sortable-columns").sortable({
        placeholder: "sortable-placeholder",
        update: function (event, ui) {
            // Reorder fields array based on new order
            let newOrder = $(this).sortable("toArray", {
                attribute: "data-index",
            });
            let newVisibleFields = new Set(
                newOrder.map((index) => fields[index])
            );
            visibleFields = newVisibleFields;
        },
    });

    // Show popup
    $("#customize-table").click(function () {
        $("#popup").toggle();
    });

    // Close popup
    $("#close-popup").click(function () {
        $("#popup").hide();
    });

    // Apply changes to table
    $("#apply-changes").click(function () {
        $("#emails_table").text("");
        buildTable();
        $("#popup").hide();
    });

    searchData();
});
