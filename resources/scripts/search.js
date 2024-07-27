// Function to handle button clicks and toggle the corresponding popup
function togglePopup(button, popup) {
    if (button.length && popup.length) {
        const offset = button.offset();
        if (offset) {
            popup.css({
                display: popup.is(":visible") ? "none" : "block",
            });
            if (button.hasClass("help-button")) {
                popup.css({
                    left:
                        button.offset().left -
                        popup.outerWidth() -
                        parseInt(
                            getComputedStyle(
                                document.documentElement
                            ).getPropertyValue("--popup-distance")
                        ), // Position to the left of the button
                });
            }
        }
    }
}

// Function to format date and time as yyyy-mm-ddThh:mm
function formatDateTime(date) {
    const pad = (n) => (n < 10 ? "0" + n : n);
    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate()) +
        " " +
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes())
    );
}

// Main function for the search page
$(document).ready(function () {
    // Set variables for the code
    let fields = [];
    let visibleFields = new Set([
        "id",
        "email_datetime",
        "sender",
        "recipients",
        "subject",
        "final_verdict",
    ]);
    let send_data = {};
    let table_data = "";
    let sub_map_fields = {};
    let filtered_fields = new Set();

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
        if (event.which === 13) {
            if ($(this).val() != "") {
                send_data["text"] = $(this).val();
                searchData();
            } else {
                delete send_data["text"];
                searchData();
            }
        }
    });

    // Get the data in an email using the custom fields
    function getFieldData(email, field) {
        if (email[field]) {
            return email[field];
        } else if (sub_map_fields.hasOwnProperty(field)) {
            const fieldPath = sub_map_fields[field];
            let current = email;

            for (let i = 0; i < fieldPath.length; i++) {
                if (current[fieldPath[i]] === undefined) {
                    return "";
                }
                current = current[fieldPath[i]];
            }

            return current;
        } else {
            return "";
        }
    }

    // Get the pretty form for a field header
    function getPrettyFormat(value) {
        value_parts = value.split("_");
        if (value_parts[0] === "analyses") {
            value_parts.shift();
            value_parts.push("module", "verdict");
        } else if (value_parts[0] === "id") {
            value_parts[0] = "Email ID";
        }
        for (let i = 0; i < value_parts.length; i++)
            value_parts[i] =
                value_parts[i].charAt(0).toUpperCase() +
                value_parts[i].slice(1);
        return value_parts.join(" ");
    }

    // Send to the server a request for a new query
    function searchData() {
        $("#emails_table").empty();
        loadData();
        $.ajax({
            url: "/search",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(send_data),
            success: function (response) {
                $("#error_message").text("");
                table_data = response;
                if (fields.length === 0) setFields(table_data);
                buildTable();
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
    function setFields(data) {
        let keysMap = new Map();

        // Function to extract keys and their types, including nested keys
        function extractKeys(obj, parentKey = "") {
            Object.keys(obj).forEach((key) => {
                const fullKey = parentKey ? `${parentKey}_${key}` : key;

                if (
                    typeof obj[key] === "object" &&
                    obj[key] !== null &&
                    !Array.isArray(obj[key])
                ) {
                    extractKeys(obj[key], fullKey);
                } else {
                    const valueType = typeof obj[key];
                    keysMap.set(fullKey, valueType);
                    if (parentKey) {
                        sub_map_fields[fullKey] = parentKey
                            .split("_")
                            .concat(key);
                    }
                }
            });
        }

        data.forEach((email) => extractKeys(email));

        fields = new Set(keysMap.keys());

        visibleFields = new Set(
            [...visibleFields].filter((item) => fields.has(item))
        );
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
                text: getPrettyFormat(field),
            }).appendTo($headerContent);

            let $headerButtons = $("<div/>", {
                class: "d-flex",
            }).appendTo($headerContent);

            // Add filter button

            $("<button/>", {
                id: `${field}-filter-button`,
                type: "button",
                class: "btn btn-sm filter-button header-button has-popup",
                title: "Filter Column",
                "data-field": field,
                "data-popup-id": `${field}-popup`,
            })
                .html('<i class="fa-solid fa-filter"></i>')
                .appendTo($headerButtons)
                .click(function () {
                    togglePopup(
                        $(this),
                        $(`#${$(this).attr("data-popup-id")}`)
                    );
                });
            if (filtered_fields.has(field))
                $(`#${field}-filter-button`).addClass("bg-white");

            $("<div/>", {
                id: `${field}-popup`,
                class: "popup",
            })
                .append(
                    $("<div/>", {
                        class: "popup-header",
                    })
                        .append($("<span/>").text("Field Contains:"))
                        .append(
                            $("<button/>", {
                                class: "close-popup",
                            })
                                .html("&times;")
                                .click(function () {
                                    $(this).parent().parent().hide();
                                })
                        )
                )
                .append(
                    $("<div/>", {
                        class: "popup-content",
                    })
                        .append(
                            $("<input/>", {
                                type: "text",
                                id: `${field}-filter-input`,
                                class: "form-control",
                                "data-button-filter-id": `apply-filter-${field}`,
                            }).keypress(function (event) {
                                if (event.which === 13) {
                                    applyFilter(
                                        $(
                                            `#${$(this).attr(
                                                "data-button-filter-id"
                                            )}`
                                        ),
                                        field
                                    );
                                }
                            })
                        )
                        .append(
                            $("<button/>", {
                                id: `apply-filter-${field}`,
                                class: "btn btn-primary mt-2 apply-filter",
                                "data-input-filter-id": `${field}-filter-input`,
                            })
                                .text("Apply")
                                .click(function () {
                                    applyFilter($(this), field);
                                })
                        )
                )
                .appendTo($headerButtons);

            // Add sorting button
            let $sortButton = $("<button/>", {
                type: "button",
                class: "btn btn-sm sort-button header-button",
                title: "Sort",
                "data-field": field,
                "data-sort": "asc", // Initial sort state
            })
                .html('<i class="fas fa-sort"></i>')
                .appendTo($headerButtons);

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
                cell_text = getFieldData(email, field);

                if (field === "recipients" && email[field].length > 1)
                    cell_text = `${email[field][0]} and ${
                        email[field].length - 1
                    } more`;
                else if (isDate(cell_text))
                    cell_text = formatDateTime(new Date(cell_text));
                $row.append($("<td>").text(cell_text));
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
                .attr("data-field", field)
                .attr("data-index", index) // Store original index as data attribute
                .append(
                    $("<input>", { type: "checkbox", class: "checkbox-column" })
                        .prop("checked", visibleFields.has(field))
                        .change(function () {
                            updateVisibleFields();
                        })
                )
                .append($("<span>").text(getPrettyFormat(field)));
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

    // Filter columns based on search input
    $("#column-search").on("input", function () {
        let searchText = $(this).val().toLowerCase();
        $("#sortable-columns li").each(function () {
            let fieldText = $(this).text().toLowerCase();
            if (fieldText.includes(searchText)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
        updateSelectAllCheckbox();
    });

    // Update visible fields based on checkbox states
    function updateVisibleFields() {
        let newVisibleFields = [];
        $("#sortable-columns .checkbox-column").each(function () {
            let fieldName = $(this).closest("li").attr("data-field");
            if ($(this).is(":checked")) {
                newVisibleFields.push(fieldName);
            }
        });
        visibleFields = new Set(newVisibleFields);
        updateSelectAllCheckbox();
    }

    // Handle select all checkbox change
    $("#select-all-columns").change(function () {
        let isChecked = $(this).is(":checked");
        $("#sortable-columns li:visible .checkbox-column").prop(
            "checked",
            isChecked
        );
        updateVisibleFields();
    });

    // Update select all checkbox state
    function updateSelectAllCheckbox() {
        let allChecked =
            $("#sortable-columns li:visible .checkbox-column:checked")
                .length ===
            $("#sortable-columns li:visible .checkbox-column").length;
        $("#select-all-columns").prop("checked", allChecked);
    }

    // Event listener for table customization button
    $(".has-popup").click(function () {
        togglePopup($(this), $(`#${$(this).attr("data-popup-id")}`));
    });

    $(".close-popup").click(function () {
        $(this).parent().parent().hide();
    });

    // Hide popup when clicking outside of it
    $(document).mouseup(function (event) {
        if (!$(event.target).closest(".popup").length) {
            $(".popup").hide();
        }
    });

    // Apply changes with the columns to table
    $("#apply-column-changes").click(function () {
        $(this).closest(".popup").hide();
        buildTable();
    });

    // Add or update a field by value
    function addField(field, value) {
        // Add the filter icon a background to know that its filter is activate
        filtered_fields.add(field);

        // Add the field to the search request
        const fieldPath = sub_map_fields[field];
        if (!fieldPath) {
            send_data[field] = value;
        } else {
            let current = send_data;

            for (let i = 0; i < fieldPath.length - 1; i++) {
                if (!current[fieldPath[i]]) {
                    current[fieldPath[i]] = {};
                }
                current = current[fieldPath[i]];
            }

            current[fieldPath[fieldPath.length - 1]] = value;
        }
    }

    // Function to remove a field from the map and clean up empty parent objects
    function removeField(field) {
        // Remove the filter background
        filtered_fields.delete(field);

        // Remove the field from the search request
        if (!sub_map_fields.hasOwnProperty(field)) {
            delete send_data[field];
        } else {
            const fieldPath = sub_map_fields[field];
            let current = send_data;

            // Traverse to the parent of the field to be deleted
            for (let i = 0; i < fieldPath.length - 1; i++) {
                if (current[fieldPath[i]] === undefined) {
                    return; // Field not found
                }
                current = current[fieldPath[i]];
            }

            // Remove the field
            delete current[fieldPath[fieldPath.length - 1]];

            // Clean up empty objects
            function cleanUpEmptyObjects(o) {
                Object.keys(o).forEach((key) => {
                    if (
                        typeof o[key] === "object" &&
                        o[key] !== null &&
                        !Array.isArray(o[key])
                    ) {
                        if (Object.keys(o[key]).length === 0) {
                            delete o[key];
                        } else {
                            cleanUpEmptyObjects(o[key]);
                        }
                    }
                });
            }

            cleanUpEmptyObjects(send_data);
        }
    }

    // Event listener for apply filter button inside each popup
    function applyFilter(button, field) {
        const inputValue = $(`#${button.attr("data-input-filter-id")}`).val();
        if (inputValue) {
            addField(field, inputValue);
            // Store input value in local storage
            //localStorage.setItem(`${field}-filter-input-value`, inputValue);
            // Add background color when filter is applied
            button.addClass("filter-applied");
        } else {
            removeField(field);
            // Clear input value in local storage
            // localStorage.removeItem(`${field}-filter-input-value`);
            // Add background color when filter is applied
            button.removeClass("filter-applied");
        }
        $(this).closest(".popup").hide();
        searchData();
    }

    function modifyDateFilter(field, value) {
        if (value) addField(field, value);
        else removeField(field);
    }

    function applyDateFilter(button) {
        button.closest(".popup").hide();
        modifyDateFilter("from_time", $("#from-date").val());
        modifyDateFilter("to_time", $("#to-date").val());
        searchData();
    }

    // Apply changes with the date range to table
    $("#apply-date-filter").click(function () {
        applyDateFilter($(this));
    });

    $("#clear-date-filter").click(function () {
        $("#from-date").val("");
        $("#to-date").val("");
        applyDateFilter($(this));
    });

    // Helper function to check if a value is a valid Date
    function isDate(value) {
        return (
            value !== parseInt(value) &&
            new Date(value) !== "Invalid Date" &&
            !isNaN(new Date(value))
        );
    }

    // Function to sort the table
    function sortTable(field, order) {
        table_data.sort((a, b) => {
            let aValue = getFieldData(a, field);
            let bValue = getFieldData(b, field);

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

document.addEventListener("DOMContentLoaded", function () {
    // Set max attribute to current date and time
    const now = new Date();
    const maxDateTime = formatDateTime(now);

    document.getElementById("from-date").max = maxDateTime;
    document.getElementById("to-date").max = maxDateTime;

    // Ensure from-date is always before to-date
    document
        .getElementById("from-date")
        .addEventListener("change", function () {
            const fromDate = new Date(this.value);
            const toDateElem = document.getElementById("to-date");
            const toDate = new Date(toDateElem.value);

            if (fromDate > toDate) {
                toDateElem.value = this.value;
            }
        });

    document.getElementById("to-date").addEventListener("change", function () {
        const toDate = new Date(this.value);
        const fromDateElem = document.getElementById("from-date");
        const fromDate = new Date(fromDateElem.value);

        if (toDate < fromDate) {
            fromDateElem.value = this.value;
        }
    });
});
