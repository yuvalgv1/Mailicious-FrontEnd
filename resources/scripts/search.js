$(document).ready(function () {
    let fields = [];
    let visibleFields = new Set();
    let url = "/search/email";
    let send_data = {};
    let table_data = "";
    let from_time = null;
    let to_time = null;

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
            send_data[text] = $(this).val();
            searchData();
        } else if ($(this).val() == "" && url == "/search/text") {
            url = "/search/email";
            delete send_data[text];
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
            data: JSON.stringify(send_data),
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

    // Display the data
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
    $(".help-button").click(function () {
        $(`#${$(this).attr("data-popup-id")}`).toggle();
    });

    // Close popup
    $(".close-popup").click(function () {
        $(this).closest(".popup").hide();
    });

    // Hide popup when clicking outside of it
    $(document).mouseup(function (event) {
        if (!$(event.target).closest(".popup").length) {
            $(".popup").hide();
        }
    });

    // Apply changes with the columns to table
    $("#apply-column-changes").click(function () {
        buildTable();
        $(this).closest(".popup").hide();
    });

    function modify_date_range(field, value) {
        if (value) send_data[field] = value;
        else delete send_data[field];
    }

    // Apply changes with the date range to table
    $("#apply-date-filter").click(function () {
        $(this).closest(".popup").hide();
        modify_date_range("from_time", $("#from-date").val());
        modify_date_range("to_time", $("#to-date").val());
        searchData();
    });

    // Helper function to check if a value is a valid Date
    function isDate(value) {
        return new Date(value) !== "Invalid Date" && !isNaN(new Date(value));
    }

    // Function to sort the table
    function sortTable(field, order) {
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

            // Convert to numbers for numeric comparison
            if (typeof aValue === "number" && typeof bValue === "number") {
                return order === "asc" ? aValue - bValue : bValue - aValue;
            }

            // Convert to Date objects for date comparison
            if (isDate(aValue) && isDate(bValue)) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
                return order === "asc" ? aValue - bValue : bValue - aValue;
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

document.addEventListener("DOMContentLoaded", function() {
    // Function to format date and time as yyyy-mm-ddThh:mm
    function formatDateTime(date) {
        const pad = (n) => n < 10 ? '0' + n : n;
        return date.getFullYear() + '-' +
               pad(date.getMonth() + 1) + '-' +
               pad(date.getDate()) + 'T' +
               pad(date.getHours()) + ':' +
               pad(date.getMinutes());
    }

    // Set max attribute to current date and time
    const now = new Date();
    const maxDateTime = formatDateTime(now);

    document.getElementById("from-date").max = maxDateTime;
    document.getElementById("to-date").max = maxDateTime;

    // Ensure from-date is always before to-date
    document.getElementById("from-date").addEventListener("change", function() {
        const fromDate = new Date(this.value);
        const toDateElem = document.getElementById("to-date");
        const toDate = new Date(toDateElem.value);

        if (fromDate > toDate) {
            toDateElem.value = this.value;
        }
    });

    document.getElementById("to-date").addEventListener("change", function() {
        const toDate = new Date(this.value);
        const fromDateElem = document.getElementById("from-date");
        const fromDate = new Date(fromDateElem.value);

        if (toDate < fromDate) {
            fromDateElem.value = this.value;
        }
    });
});
