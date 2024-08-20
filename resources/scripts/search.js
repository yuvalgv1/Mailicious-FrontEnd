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
    // Handle fields for the table
    let fields = [];
    let visibleFields = new Set([
        "id",
        "email_datetime",
        "sender",
        "recipients",
        "subject",
        "final_verdict",
    ]);
    let sendData = {};
    let tableData = "";
    let subMapFields = {};
    let filteredFields = new Set();
    let valuesToFilter = {};

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
                sendData["text"] = $(this).val();
                searchData();
            } else {
                delete sendData["text"];
                searchData();
            }
        }
    });

    // Get the data in an email using the custom fields
    function getFieldData(email, field) {
        if (typeof email[field] === "boolean") return email[field] ? "V" : "X";
        if (email[field]) {
            return email[field];
        } else if (subMapFields.hasOwnProperty(field)) {
            const fieldPath = subMapFields[field];
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
        valueParts = value.split("_");
        if (valueParts[0] === "analyses") {
            valueParts.shift();
            valueParts.push("module", "verdict");
        } else if (valueParts[0] === "id") {
            valueParts[0] = "Email ID";
        }
        for (let i = 0; i < valueParts.length; i++)
            valueParts[i] =
                valueParts[i].charAt(0).toUpperCase() + valueParts[i].slice(1);
        return valueParts.join(" ");
    }

    // Send to the server a request for a new query
    function searchData() {
        $("#emails_table").empty();
        loadData();
        $.ajax({
            url: "/search",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(sendData),
            success: function (response) {
                $("#error_message").text("");
                tableData = response;
                if (fields.length === 0) setFields(tableData);
                buildTable();
            },
            error: function (res) {
                if (res.status == 401) window.location.href = "/login";
                if (res.responseJSON && res.responseJSON.error)
                    $("#error_message").text(res.responseJSON.error);
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
                        subMapFields[fullKey] = parentKey
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

        // Create the list in the filters popups
        visibleFields.forEach((field) => {});

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
                "data-popup-id": `${field}-popup`,
            })
                .append(
                    $("<i/>", {
                        class: "fa-solid fa-filter",
                    })
                )
                .appendTo($headerButtons)
                .click(function () {
                    togglePopup($(this), $(`#${$(this).data("popup-id")}`));
                });
            if (filteredFields.has(field))
                $(`#${field}-filter-button`).addClass("text-primary");

            $("<div/>", {
                id: `${field}-popup`,
                class: "popup",
            })
                .append(
                    $("<div/>", {
                        class: "popup-header",
                    })
                        .append($("<span/>").text("Filter field:"))
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
                                id: `${field}-search`,
                                class: "form-control mb-2",
                                placeholder: "Search for values...",
                            }).on("input", function () {
                                searchValuesInList(field);
                            })
                        )
                        .append(
                            $("<div/>", {
                                class: "form-check mb-2",
                            })
                                .append(
                                    $("<input/>", {
                                        type: "checkbox",
                                        class: "form-check-input",
                                        id: `select-all-${field}`,
                                    }).change(function () {
                                        selectAllBoxChange(field);
                                    })
                                )
                                .append(
                                    $("<label/>", {
                                        class: "form-check-label",
                                        for: `select-all-${field}`,
                                    }).text("Select All")
                                )
                        )
                        .append(
                            $("<ul/>", {
                                id: `${field}-list`,
                                class: "list-group",
                            })
                        )
                        .append(
                            $("<button/>", {
                                id: `apply-filter-${field}`,
                                class: "btn btn-primary mt-2 apply-filter",
                            })
                                .text("Apply Filter")
                                .click(function () {
                                    applyFilter(field);
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
                $sortButton.data("sort", currentSortOrder);
                $sortButton.html(
                    `<i class="fas fa-sort-${
                        currentSortOrder === "asc" ? "up" : "down"
                    }"></i>`
                );
            } else {
                $sortButton.data("sort", "asc"); // Default sort order
            }

            $sortButton.click(function () {
                let $this = $(this);
                let field = $this.data("field");
                let currentSort = $this.data("sort");
                let newSort = currentSort === "asc" ? "desc" : "asc";

                // Update sort indicator
                $(".sort-button").html('<i class="fas fa-sort"></i>');
                $this.html(
                    `<i class="fas fa-sort-${
                        newSort === "asc" ? "up" : "down"
                    }"></i>`
                );
                $this.data("sort", newSort);

                // Sort table
                sortTable(field, newSort);
            });
        });

        // Add data
        $tableBody = $table.append(
            $("<tbody/>", {
                class: "table-group-divider",
            })
        );

        let tempData = new Map();

        tableData.forEach((email) => {
            const $row = $("<tr>");
            visibleFields.forEach((field) => {
                // Display data in the table
                cellText = getFieldData(email, field);

                if (field === "recipients" && email[field].length > 1)
                    cellText = `${email[field][0]} and ${
                        email[field].length - 1
                    } more`;
                else if (isDate(cellText)) {
                    cellText = formatDateTime(new Date(cellText));
                }
                $row.append($("<td>").text(cellText));

                // Temporarly create a set for every value in a field
                if (!tempData[field]) tempData[field] = new Set();
                if (field === "recipients") {
                    email[field].forEach((recipient) => {
                        tempData[field].add(recipient);
                    });
                } else tempData[field].add(cellText);
            });
            $tableBody.append($row);
        });

        // Using tempData, create the list in the filter popups
        for (let fieldName in tempData) {
            let fieldSet = tempData[fieldName];
            fieldSet.forEach((value) => {
                let listItem = $("<li/>")
                    .addClass("list-group-item")
                    .data("value", value)
                    .append(
                        $("<input>", {
                            type: "checkbox",
                            class: "checkbox-column",
                        })
                            .prop("checked", fieldSet.has(value))
                            .change(function () {
                                updateVisibleEntries(fieldName);
                            })
                    )
                    .append($("<span>").text(value));
                $(`#${fieldName}-list`).append(listItem);
            });
            updateSelectAllCheckbox(fieldName);
        }

        // Remove the loading message
        removeLoading();
    }

    // Update visible fields based on checkbox states
    function updateVisibleEntries(checklistID) {
        if (checklistID === "columns") {
            let newVisibleFields = [];
            $(`#${checklistID}-list .checkbox-column`).each(function () {
                let fieldName = $(this).closest("li").data("field");
                if ($(this).is(":checked")) {
                    newVisibleFields.push(fieldName);
                }
            });
            visibleFields = new Set(newVisibleFields);
        } else {
            let newVisibleValues = [];
            $(`#${checklistID}-list .checkbox-column`).each(function () {
                let value = $(this).closest("li").data("value");
                if ($(this).is(":checked")) {
                    newVisibleValues.push(value);
                }
            });
            if (newVisibleValues.length > 0)
                valuesToFilter[checklistID] = newVisibleValues;
            else delete valuesToFilter[checklistID];
        }

        updateSelectAllCheckbox(checklistID);
    }

    // Handle select all checkbox change
    function selectAllBoxChange(checklistID) {
        let isChecked = $(`#select-all-${checklistID}`).is(":checked");
        $(`#${checklistID}-list li:visible .checkbox-column`).prop(
            "checked",
            isChecked
        );
        updateVisibleEntries(checklistID);
    }

    // Update select all checkbox state
    function updateSelectAllCheckbox(checklistID) {
        let allChecked =
            $(`#${checklistID}-list li:visible .checkbox-column:checked`)
                .length ===
            $(`#${checklistID}-list li:visible .checkbox-column`).length;
        $(`#select-all-${checklistID}`).prop("checked", allChecked);
    }

    // Filter values based on search input
    function searchValuesInList(checklistID) {
        $searchInput = $(`#${checklistID}-search`);
        let searchText = $searchInput.val().toLowerCase();
        $(`#${checklistID}-list li`).each(function () {
            let fieldText = $(this).text().toLowerCase();
            if (fieldText.includes(searchText)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
        updateSelectAllCheckbox(checklistID);
    }

    // Populate sortable list with columns
    function populateSortableList() {
        let sortableList = $("#columns-list");
        sortableList.empty();
        fields.forEach((field, index) => {
            let listItem = $("<li/>")
                .addClass("list-group-item order-column-item")
                .data("field", field)
                .data("index", index) // Store original index as data attribute
                .append(
                    $("<input>", { type: "checkbox", class: "checkbox-column" })
                        .prop("checked", visibleFields.has(field))
                        .change(function () {
                            updateVisibleEntries("columns");
                        })
                )
                .append($("<span>").text(getPrettyFormat(field)));
            sortableList.append(listItem);
        });
    }

    // Handle pressing on the select all button on the column order popup
    $("#select-all-columns").change(function () {
        selectAllBoxChange("columns");
    });

    // Initialize sortable
    $("#columns-list").sortable({
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
    $("#columns-search").on("input", function () {
        searchValuesInList("columns");
    });

    // Event listener for table customization button
    $(".has-popup").click(function () {
        togglePopup($(this), $(`#${$(this).data("popup-id")}`));
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
        filteredFields.add(field);

        // Add the field to the search request
        const fieldPath = subMapFields[field];
        if (!fieldPath) {
            sendData[field] = value;
        } else {
            let current = sendData;

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
        filteredFields.delete(field);

        // Remove the field from the search request
        if (!subMapFields.hasOwnProperty(field)) {
            delete sendData[field];
        } else {
            const fieldPath = subMapFields[field];
            let current = sendData;

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

            cleanUpEmptyObjects(sendData);
        }
    }

    // Event listener for apply filter button inside each popup
    function applyFilter(field) {
        const inputValue = valuesToFilter[field];
        $button = $(`#${field}-filter-button`);
        if (inputValue) addField(field, inputValue);
        else removeField(field);

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
        // Regular expression for the ISO 8601 format (YYYY-MM-DDTHH:mm:ss.ssssss)
        const iso8601Format = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+$/;
        const anotherFormat = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+$/;

        // Check if the value matches the ISO 8601 format regex
        if (iso8601Format.test(value) || anotherFormat.test(value)) {
            // Check if the value is a valid date
            const date = new Date(value);
            return !isNaN(date.getTime());
        }
        return false;
    }

    // Function to sort the table
    function sortTable(field, order) {
        tableData.sort((a, b) => {
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
