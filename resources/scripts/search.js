$(document).ready(function () {
    let fields = [];
    let visibleFields = new Set();
    let url = "/search/email";
    let send_data = JSON.stringify({});
    let table_data = "";

    // Variables to track current sort field and order
    let currentSortField = null;
    let currentSortOrder = null;

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
        $("#emails_table").empty();
        loadData();
        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json",
            data: send_data,
            success: function (response) {
                $("#error_message").text("");
                if (fields.length === 0) setFields(response);
                table_data = response;
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
    function setFields(Data) {
        let keysMap = new Map();

        Data.forEach((email) => {
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
        $table.empty();

        // Add headers for the table
        let $thead = $("<thead/>").appendTo($table);
        let $headerRow = $("<tr/>", {
            id: "table-head-row",
        }).appendTo($thead);

        visibleFields.forEach((field) => {
            let $th = $("<th/>", {
                scope: "col",
            }).appendTo($headerRow);

            // Create a flex container for text and sorting button
            let $headerContent = $("<div/>", {
                class: "d-flex justify-content-between align-items-center",
            }).appendTo($th);

            // Add field text
            $("<span/>", {
                text: field,
            }).appendTo($headerContent);

            // Add sorting button
            let $sortButton = $("<button/>", {
                type: "button",
                class: "btn btn-sm sort-button",
                "data-field": field,
                "data-sort": "asc", // Initial sort state
            })
                .html('<i class="fas fa-sort"></i>')
                .appendTo($headerContent);

            // Check if this is the currently sorted field
            if (field === currentSortField) {
                $sortButton.attr("data-sort", currentSortOrder);
                $sortButton.html(
                    `<i class="fas fa-sort-${
                        currentSortOrder === "asc" ? "up" : "down"
                    }"></i>`
                );
            } else {
                $sortButton.attr("data-sort", "asc"); // Default sort order
            }

            $sortButton.click(function () {
                let $this = $(this);
                let field = $this.attr("data-field");
                let currentSort = $this.attr("data-sort");
                let newSort = currentSort === "asc" ? "desc" : "asc";

                // Update sort indicator
                $(".sort-button").html('<i class="fas fa-sort"></i>');
                $this.html(
                    `<i class="fas fa-sort-${
                        newSort === "asc" ? "up" : "down"
                    }"></i>`
                );
                $this.attr("data-sort", newSort);

                // Sort table
                sortTable(field, newSort);
            });
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
                            let newVisibleFields = [];
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
        buildTable();
        $("#popup").hide();
    });

    // Function to sort the table
    function sortTable(field, order) {
        console.log(order);
        table_data.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];

            // Handle empty cells: Treat them as the highest value
            if (order == "desc") {
                if (!aValue) return -1; // Empty cells go first
                if (!bValue) return 1; // Empty cells go first
            } else {
                if (!aValue) return 1; // Empty cells go last
                if (!bValue) return -1; // Empty cells go last
            }

            // Case insensitivity: Convert to lower or upper case for comparison
            aValue = aValue.toString().toLowerCase();
            bValue = bValue.toString().toLowerCase();

            if (order === "desc") {
                return bValue.localeCompare(aValue);
            } else {
                return aValue.localeCompare(bValue);
            }
        });

        // Update current sort field and order
        currentSortField = field;
        currentSortOrder = order;

        // Rebuild table with sorted data
        buildTable();
    }

    searchData();
});
