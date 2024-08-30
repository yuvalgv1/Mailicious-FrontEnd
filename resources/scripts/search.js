// Function to handle button clicks and toggle the corresponding popup
function togglePopup(button, popup) {
    if (button.length && popup.length) {
        const offset = button.offset();
        if (offset) {
            popup.css({
                display: popup.is(":visible") ? "none" : "block",
            });
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
        pad(date.getMinutes()) +
        ":" +
        pad(date.getSeconds())
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
    let currentFilterField = "";
    let allValues = {};

    // Variables to track current sort field and order
    let currentSortField = null;
    let currentSortOrder = null;

    // Put the modal on top
    $("#filterModal").appendTo($("body"));

    // Add loading message when waiting for the server to send the data.
    function loadData() {
        $(".loading_message")
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
        $(".loading_message").html("");
    }

    $("#search-input").keypress(function (event) {
        if (event.which === 13) {
            if ($(this).val() != "") {
                sendData["text"] = $(this).val();
                $(this).val("");
                $("#clear-all-filters").prop("hidden", false);
                searchData();
            } else {
                delete sendData["text"];
                searchData();
            }
        }
    });

    // Get the data in an email using the custom fields
    function getFieldData(email, field) {
        if (typeof email[field] === "boolean") return email[field];
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

    // Get the list of all the fields that the server can process
    function getFilterableFields() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/search/group/meta",
                type: "GET",
                success: function (res) {
                    resolve(res.slice(1));
                },
                error: function (res) {
                    if (res.status == 401) {
                        window.location.href = "/login";
                    }
                    if (res.responseJSON && res.responseJSON.error) {
                        $("#error_message").text(res.responseJSON.error);
                    }
                    reject(res);
                },
            });
        });
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
                // Close the modal
                const modalElement = document.querySelector(".modal");
                const modalInstance =
                    bootstrap.Modal.getOrCreateInstance(modalElement);
                modalInstance.hide();

                $("#error_message").text("");
                $("#modal_error").text("");
                tableData = response;
                if (fields.length === 0) setFields(tableData);
                buildTable();
            },
            error: function (res) {
                if (res.status == 401) window.location.href = "/login";
                if (res.responseJSON && res.responseJSON.error) {
                    $("#error_message").text(res.responseJSON.error);
                    $("#modal_error").text(res.responseJSON.error);
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

        populateSortableList();
    }

    // Display the data
    async function buildTable() {
        // Enter the data from the table
        $table = $("#emails_table");
        $table.empty();

        // Show the clear filter button if there are filteres and hide if there aren't
        if (filteredFields.size > 0 || sendData.hasOwnProperty("text"))
            $("#clear-all-filters").prop("hidden", false);
        else $("#clear-all-filters").prop("hidden", true);

        // Add headers for the table
        let $thead = $("<thead/>").appendTo($table);
        let $headerRow = $("<tr/>", {
            id: "table-head-row",
        }).appendTo($thead);

        // Get the list of the
        const filterableFields = await getFilterableFields();

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
            if (filterableFields.includes(field)) {
                $("<button/>", {
                    id: `${field}-filter-button`,
                    type: "button",
                    class: "btn btn-sm filter-button header-button has-popup",
                    title: "Filter Column",
                    "data-bs-toggle": "modal",
                    "data-bs-target": "#filterModal",
                    "data-field": field,
                })
                    .append(
                        $("<i/>", {
                            class: "fa-solid fa-filter",
                        })
                    )
                    .appendTo($headerButtons);
                if (filteredFields.has(field))
                    $(`#${field}-filter-button`).addClass("text-primary");
            }

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

        fields.forEach((field) => {
            allValues[field] = new Set();
        });

        tableData.forEach((email) => {
            const $row = $("<tr>");
            visibleFields.forEach((field) => {
                // Display data in the table
                cellText = getFieldData(email, field);

                if (field === "recipients" && email[field].length > 1) {
                    cellText = `${email[field][0]} and ${
                        email[field].length - 1
                    } more`;
                } else if (isDate(cellText)) {
                    cellText = formatDateTime(new Date(cellText));
                }
                $row.append($("<td>").text(cellText));

                if (field === "recipients") {
                    email[field].forEach((recipient) => {
                        allValues[field].add(recipient);
                    });
                } else allValues[field].add(cellText);
            });
            $tableBody.append($row);
        });
        console.log(allValues["recipients"]);

        // Remove the loading message
        removeLoading();
    }

    // Update visible fields based on checkbox states
    function updateVisibleEntries(type) {
        if (type === "columns") {
            let newVisibleFields = [];
            $(`#${type}-list .checkbox-column`).each(function () {
                let fieldName = $(this).closest("li").data("field");
                if ($(this).is(":checked")) {
                    newVisibleFields.push(fieldName);
                }
            });
            visibleFields = new Set(newVisibleFields);
        } else {
            let newVisibleValues = [];
            $(`#${type}-list .checkbox-column`).each(function () {
                let value = $(this).closest("li").data("value");
                if ($(this).is(":checked")) {
                    newVisibleValues.push(value);
                }
            });
            if (newVisibleValues.length > 0) {
                if (typeof newVisibleValues[0] === "boolean")
                    if (newVisibleValues.length === 1)
                        valuesToFilter[currentFilterField] =
                            newVisibleValues[0];
                    else delete valuesToFilter[currentFilterField];
                else valuesToFilter[currentFilterField] = newVisibleValues;
            } else delete valuesToFilter[currentFilterField];
        }

        updateSelectAllCheckbox(type);
    }

    // Handle select all checkbox change
    function selectAllBoxChange(type) {
        let isChecked = $(`#select-all-${type}`).is(":checked");
        $(`#${type}-list li:visible .checkbox-column`).prop(
            "checked",
            isChecked
        );
        updateVisibleEntries(type);
    }

    // Update select all checkbox state
    function updateSelectAllCheckbox(type) {
        let allChecked =
            $(`#${type}-list li:visible .checkbox-column:checked`).length ===
            $(`#${type}-list li:visible .checkbox-column`).length;
        $(`#select-all-${type}`).prop("checked", allChecked);
    }

    // Filter values based on search input
    function searchValuesInList(type) {
        $searchInput = $(`#${type}-search`);
        let searchText = $searchInput.val().toLowerCase();
        $(`#${type}-list li`).each(function () {
            let fieldText = $(this).text().toLowerCase();
            if (fieldText.includes(searchText)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
        updateSelectAllCheckbox(type);
    }

    // Populate sortable list with columns
    function populateSortableList() {
        let sortableList = $("#columns-list");
        sortableList.empty();
        fields.forEach((field) => {
            let listItem = $("<li/>")
                .addClass("list-group-item order-column-item")
                .attr("data-field", field)
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

    // Initialize sortable
    $("#columns-list").sortable({
        placeholder: "sortable-placeholder",
        update: function (event, ui) {
            // Reorder fields array based on new order
            let newOrder = $(this).sortable("toArray", {
                attribute: "data-field",
            });

            // Convert Set to an array to be able to map values by order
            const fieldsArray = Array.from(visibleFields);

            // Create a new set for visible fields, ensuring it respects the new order
            let newVisibleFields = new Set();

            newOrder.forEach((field) => {
                // Find the corresponding field object in the array
                let matchingField = fieldsArray.find((item) => item === field);
                if (matchingField) {
                    newVisibleFields.add(matchingField);
                }
            });

            visibleFields = newVisibleFields;
        },
    });

    // Handle pressing on the select all button on the column order popup
    $("#select-all-columns").change(function () {
        selectAllBoxChange("columns");
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

    function modifyDateFilter(field, value) {
        if (value) addField(field, value);
        else removeField(field);
    }

    function applyDateFilter(button) {
        button.closest(".popup").hide();
        modifyDateFilter("from_time", $("#from-date").val());
        modifyDateFilter("to_time", $("#to-date").val());
        currentFilterField = searchData();
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
        const iso8601Format = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;
        const anotherFormat = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d+$/;

        // Check if the value matches the ISO 8601 format regex
        if (iso8601Format.test(value) || anotherFormat.test(value)) {
            // Check if the value is a valid date
            const date = new Date(value);
            return !isNaN(date.getTime());
        }
        return false;
    }

    $(document).on("click", ".filter-button", function () {
        currentFilterField = $(this).data("field");
        $("#modal-search").val("");
        $list = $("#modal-list").empty();

        allValues[currentFilterField].forEach((value) => {
            $list.append(
                $("<li/>", {
                    class: "list-group-item",
                    "data-value": value,
                })
                    .append(
                        $("<input>", {
                            type: "checkbox",
                            class: "checkbox-column",
                        })
                            .prop("checked", true)
                            .change(function () {
                                updateVisibleEntries("modal");
                            })
                    )
                    .append($("<span>").text(value))
            );
        });
        updateSelectAllCheckbox("modal");
    });

    $(document).on("input", "#modal-search", function () {
        searchValuesInList("modal");
    });

    $(document).on("change", "#select-all-modal", function () {
        selectAllBoxChange("modal");
    });

    // Clear Filter
    function clearFilter() {
        if (
            currentFilterField === "from_time" ||
            currentFilterField === "to_time"
        ) {
            $("#from-date").val("");
            $("#to-date").val("");
        } else {
            $("#modal-search").val("");
            $(`#modal-list .checkbox-column:checked`).prop("checked", false);
            updateVisibleEntries("modal");
        }

        applyFilter();
    }

    $(document).on("click", "#clear-filter", function () {
        clearFilter();
        searchData();
    });

    $(document).on("click", "#add-filter", function () {
        applyFilter();
        searchData();
    });

    // Event listener for apply filter button inside the filter
    function applyFilter() {
        const inputValue = valuesToFilter[currentFilterField];
        if (inputValue) addField(currentFilterField, inputValue);
        else removeField(currentFilterField);
    }

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

    // Handle the clear all filters buttons
    $("#clear-all-filters").click(function () {
        delete sendData["text"];
        filteredFields.forEach((field) => {
            currentFilterField = field;
            clearFilter();
        });
        searchData();
    });

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
