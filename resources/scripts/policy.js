$(document).ready(function () {
    let modules = [];
    let verdicts = [];
    let actions = [];

    let togglePrefix = "toggle-btn";
    const mainPolicyID = 1;
    const benignID = 1;
    let changesMade = {};
    let changedModules = [];
    let totalChanges = new Set();

    // Blacklist module variables
    const blacklistID = 3;
    const countriesFieldId = 4;
    let blacklistFields = {};
    let blacklistsValues = {};
    let addToBlacklist = [];
    let removeFromBlacklist = [];
    let currentModalFieldId = null;
    let listOfCountries = [];
    let searchedCountries = [];
    let changed = false;

    const $modulesTable = $("#modules_table tbody");
    $("#blacklistFieldModal").appendTo($("body"));
    $("#blacklistCountriesModal").appendTo($("body"));

    // Add loading message when waiting for the server to send the data.
    function loadingAnimation() {
        $("#loading_message")
            .append(" Loading Data...")
            .append(
                $("<span/>", {
                    class: "spinner-border spinner-border-sm",
                    role: "status",
                })
            );
    }

    // Remove the loading Data text
    function removeLoading() {
        $("#loading_message").html("");
    }

    // Change state of the apply changes button.
    function enableApplyChangesButton() {
        $("#apply-changes").prop("disabled", false);
    }

    // Change state of the apply changes button.
    function disableApplyChangesButton() {
        $("#apply-changes").prop("disabled", true);
    }

    // Load the modules list from the server
    function loadModules() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/enum_modules",
                type: "GET",
                success: function (res) {
                    modules = res;
                    resolve();
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

    // Load the verdicts list from the server
    function loadVerdicts() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/enum_verdicts",
                type: "GET",
                success: function (res) {
                    verdicts = res;
                    resolve();
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

    // Load the actions list from the server
    function loadActions() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/actions",
                type: "GET",
                success: function (res) {
                    actions = res;
                    resolve();
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

    // Load the field list for the blacklist module
    function loadBlacklistFields() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/blacklist/fields",
                type: "GET",
                success: function (res) {
                    res.forEach((field) => {
                        blacklistFields[field.id] = field.name;
                    });
                    resolve();
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

    // Load the values to input the blacklist module
    function loadBlacklistValues() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/blacklist",
                type: "GET",
                success: function (res) {
                    blacklistsValues = {}
                    res.forEach((value) => {
                        const { field_id, ...rest } = value;
                        if (!(field_id in blacklistsValues))
                            blacklistsValues[field_id] = [];
                        blacklistsValues[field_id].push(rest);
                    });
                    resolve();
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

    // Clear the current state of the list and update the look of the list with the current state
    function renderBlacklist() {
        var list = $("#blacklistValues");
        list.empty();
        var valuesInList = blacklistsValues[currentModalFieldId];
        if (valuesInList) {
            // Add counter of items
            $("#list-counter").text(`${valuesInList.length} items`);

            valuesInList.forEach((entry) => {
                list.append(
                    $("<li/>", {
                        class: "list-group-item d-flex justify-content-between align-items-center",
                        text: entry.value,
                    }).append(
                        $("<button/>", {
                            class: "btn btn-danger btn-sm remove-btn",
                            text: "Remove",
                        })
                    )
                );
            });
        } else {
            $("#list-counter").text("0 items");
        }

        // Adapt the state of the apply changes button if there's a need to
        if (addToBlacklist.length + removeFromBlacklist.length > 0)
            totalChanges.add("Blacklist");
        else totalChanges.delete("Blacklist");

        if (totalChanges.size > 0) enableApplyChangesButton();
        else disableApplyChangesButton();
    }

    // Add new value to the list
    $(document).on("click", ".add-value-btn", function () {
        const newValue = $("#newListValueInput").val().trim();

        // Clear input field
        $("#newListValueInput").val("");

        if (newValue) {
            // If this is the first time a value is added to that list
            if (!blacklistsValues[currentModalFieldId])
                blacklistsValues[currentModalFieldId] = [];

            var currentList = blacklistsValues[currentModalFieldId];

            // If the value already exists, don't change anything
            if (!currentList.some((entry) => entry.value === newValue)) {
                // If the value was removed before changes applied it will bring it back
                const index = removeFromBlacklist.findIndex(
                    (obj) => obj.value === newValue
                );

                // If the value is new, it will be added to the list without id
                if (index === -1) {
                    const newEntry = {
                        value: newValue,
                        field_id: currentModalFieldId,
                    };
                    addToBlacklist.push(newEntry);
                    currentList.push(newEntry);
                } else {
                    const [RevivedEntry] = removeFromBlacklist.splice(index, 1);
                    currentList.push(RevivedEntry);
                }

                renderBlacklist(currentModalFieldId);
            }
        }
    });

    // Remove value from the list
    $(document).on("click", ".remove-btn", function () {
        const removedValue = $(this)
            .parent()
            .contents()
            .filter(function () {
                return this.nodeType === Node.TEXT_NODE;
            })
            .text();
        var currentList = blacklistsValues[currentModalFieldId];

        // Remove the entry from the current list
        var index = currentList.findIndex((obj) => obj.value === removedValue);
        const [removedObject] = currentList.splice(index, 1);

        // Remove only objects that exists in the database
        if (removedObject.hasOwnProperty("id")) {
            removeFromBlacklist.push(removedObject);
        }

        // Remove the entry from added values if its a new value
        index = addToBlacklist.findIndex((obj) => obj.value === removedValue);

        if (index !== -1) addToBlacklist.splice(index, 1);

        renderBlacklist(currentModalFieldId);
    });

    // Get the list of countries from an API
    function getCountries() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "https://restcountries.com/v3.1/all",
                type: "GET",
                success: function (res) {
                    listOfCountries = res.map((country) => ({
                        name: country.name.common,
                        flag: country.flag,
                    }));
                    resolve();
                },
                error: function (res) {
                    if (res.status == 401) {
                        window.location.href = "/login";
                    }
                    if (res.responseJSON && res.responseJSON.error) {
                        $("#error_message").text(res.responseJSON.error);
                    }
                    reject("Error fetching countries.");
                },
            });
        });
    }

    // Render the list inside the countries modal
    function renderCountries(searchTerm = "") {
        const countryList = $("#countryList");
        countryList.empty();
        searchedCountries = [];
        if (searchTerm.length > 0) {
            try {
                var currentList = blacklistsValues[currentModalFieldId];

                searchedCountries = listOfCountries
                    .filter((country) => {
                        if (currentList) {
                            const isInExclusionList = currentList.some(
                                (excluded) =>
                                    excluded.value.toLowerCase() ===
                                    country.name.toLowerCase()
                            );

                            return (
                                country.name
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase()) &&
                                !isInExclusionList
                            );
                        } else {
                            return country.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase());
                        }
                    })
                    .sort((a, b) => {
                        const nameA = a.name.toLowerCase();
                        const nameB = b.name.toLowerCase();
                        const lowerSearchTerm = searchTerm.toLowerCase();

                        // Prioritize countries whose names start with the search term
                        const startsWithA = nameA.startsWith(lowerSearchTerm);
                        const startsWithB = nameB.startsWith(lowerSearchTerm);

                        if (startsWithA && !startsWithB) return -1;
                        if (!startsWithA && startsWithB) return 1;

                        return 0; // Keep order if both or neither start with the search term
                    });

                searchedCountries.forEach((country) => {
                    $("<li/>", {
                        class: "list-group-item d-flex justify-content-between align-items-center",
                    })
                        .append(
                            $("<span/>").text(`${country.flag} ${country.name}`)
                        )
                        .append(
                            $("<button/>", {
                                class: "btn btn-sm btn-main add-country",
                                "data-country": country.name,
                            }).text("Add")
                        )
                        .appendTo(countryList);
                });
            } catch (error) {
                $("#error_message").text("Error loading countries");
            }
        }
    }

    // Search functionality
    $("#countrySearch").on("input", function () {
        const searchTerm = $(this).val();
        renderCountries(searchTerm);
    });

    // Add country to the selected list
    function addCountry(name) {
        // If this is the first time a value is added to that list
        if (!blacklistsValues[currentModalFieldId])
            blacklistsValues[currentModalFieldId] = [];

        var currentList = blacklistsValues[currentModalFieldId];

        // If the value already exists, don't change anything
        if (!currentList.some((entry) => entry.value === name)) {
            // If the value was removed before changes applied it will bring it back
            const index = removeFromBlacklist.findIndex(
                (obj) => obj.value === name
            );

            // If the value is new, it will be added to the list without id
            if (index === -1) {
                const newEntry = {
                    value: name,
                    field_id: countriesFieldId,
                };
                addToBlacklist.push(newEntry);
                currentList.push(newEntry);
            } else {
                const [RevivedEntry] = removeFromBlacklist.splice(index, 1);
                currentList.push(RevivedEntry);
            }

            $("#countrySearch").val("");
            renderCountries("");
            renderSelectedCountries();
        }
    }

    // Trigger the adding function
    $(document).on("click", ".add-country", function () {
        addCountry($(this).data("country"));
    });

    // Remove country from the selected list
    function removeCountry(removedValue) {
        var currentList = blacklistsValues[currentModalFieldId];

        // Remove the entry from the current list
        var index = currentList.findIndex((obj) => obj.value === removedValue);
        const [removedObject] = currentList.splice(index, 1);

        // Remove only objects that exists in the database
        if (removedObject.hasOwnProperty("id")) {
            removeFromBlacklist.push(removedObject);
        }

        // Remove the entry from added values if its a new value
        index = addToBlacklist.findIndex((obj) => obj.value === removedValue);
        if (index !== -1) addToBlacklist.splice(index, 1);

        $("#countrySearch").val("");
        renderCountries("");
        renderSelectedCountries();
    }

    // Trigger the removing function
    $(document).on("click", ".remove-country", function () {
        removeCountry($(this).data("country"));
    });

    function renderSelectedCountries() {
        const selectedList = $("#selectedCountries");
        selectedList.empty();

        var valuesInList = blacklistsValues[currentModalFieldId];

        if (valuesInList) {
            // Add counter of items
            $("#list-counter-countries").text(`${valuesInList.length} items`);

            valuesInList.forEach((entry) => {
                const country = listOfCountries.find(
                    (c) => c.name === entry.value
                );
                selectedList.append(
                    $("<li/>", {
                        class: "list-group-item d-flex justify-content-between align-items-center",
                    })
                        .append(
                            $("<span/>").text(`${country.flag} ${country.name}`)
                        )
                        .append(
                            $("<button/>", {
                                class: "btn btn-sm btn-danger remove-country",
                                "data-country": country.name,
                            }).text("Remove")
                        )
                );
            });
        } else {
            $("#list-counter-countries").text("0 items");
        }

        // Adapt the state of the apply changes button if there's a need to
        if (addToBlacklist.length + removeFromBlacklist.length > 0)
            totalChanges.add("Blacklist");
        else totalChanges.delete("Blacklist");

        if (totalChanges.size > 0) enableApplyChangesButton();
        else disableApplyChangesButton();
    }

    // Open list popup when the button is clicked
    $(document).on("click", ".open-popup-btn", async function () {
        currentModalFieldId = $(this).data("field-id");
        $(".form-control").val("");

        if (currentModalFieldId === countriesFieldId) {
            $("#blacklistCountriesModal").modal("show");
            await getCountries();
            renderCountries();
            renderSelectedCountries();
        } else {
            $("#blacklistFieldModal").modal("show");
            renderBlacklist();
        }
    });

    function loadPage() {
        // Reset the error message
        $("#error_message").text("");

        modules.forEach((module) => {
            // Add the row for each module
            let $row = $("<tr>");

            // Add the main policy differently
            if (module.id === mainPolicyID) {
                $("<td/>", {
                    html: "Main Policy",
                    class: "bg-white",
                }).appendTo($row);
                $("<td/>", { class: "bg-white" }).appendTo($row);
                $modulesTable.prepend($row);
            } else {
                $row = $("<tr>", {
                    class: "module-row",
                    role: "button",
                });

                // Add the module name on the right side
                $("<td/>", {
                    html: module.name,
                }).appendTo($row);

                // Add the silder button
                $("<td/>", {
                    class: "d-flex justify-content-end",
                })
                    .append(
                        $("<label/>", {
                            class: "switch",
                        })
                            .append(
                                $("<input/>", {
                                    id: `${togglePrefix}-${module.id}`,
                                    type: "checkbox",
                                    class: "toggle-btn",
                                    checked: module.enabled,
                                })
                            )
                            .append(
                                $("<span/>", {
                                    class: "slider round toggle-btn-span",
                                })
                            )
                    )
                    .appendTo($row);
                $modulesTable.append($row);
            }

            // Add an expantion row below each row
            let $exp = $("<tr>", {
                id: `policy-row-${module.id}`,
            });
            $row.after($exp);

            // For modules, add an extra class
            if (module.id !== mainPolicyID) {
                $exp.addClass("module-detail");
                $exp.toggle();
            }

            // Add table for every module
            let $verdictTable = $("<table/>", {
                class: "table table-borderless",
            }).appendTo(
                $("<div/>", {
                    class: "container bg-white",
                }).appendTo($exp)
            );

            // Set the head of the table with the names of each type of checkbox
            $("<thead/>")
                .append(
                    $("<tr/>")
                        .append($("<td/>"))
                        .append($("<td/>").html("Block"))
                        .append($("<td/>").html("Alert"))
                )
                .appendTo($verdictTable);

            // For each module, add the verdicts in the table of checkboxes
            let $tableBody = $("<tbody/>").appendTo($verdictTable);
            verdicts.forEach((verdict) => {
                // find the right action for the current verdict
                actions.forEach((act) => {
                    if (
                        act.module_id == module.id &&
                        act.verdict_id == verdict.id
                    ) {
                        let $actionRow = $("<tr/>").append(
                            $("<td/>").html(verdict.name)
                        );

                        if (act.verdict_id !== benignID)
                            $actionRow.append(
                                $("<td/>").append(
                                    $("<input/>", {
                                        type: "checkbox",
                                        class: "action-checkbox",
                                        "data-action-id": act.id,
                                        "data-action-type": "block",
                                    }).prop("checked", act.block)
                                )
                            );
                        else $actionRow.append($("<td/>"));

                        $actionRow
                            .append(
                                $("<td/>").append(
                                    $("<input/>", {
                                        type: "checkbox",
                                        class: "action-checkbox",
                                        "data-action-id": act.id,
                                        "data-action-type": "alert",
                                    }).prop("checked", act.alert)
                                )
                            )
                            .appendTo($tableBody);
                    }
                });
            });
        });

        // Dynamically add the apply changes button at the end of the page
        $("#apply-changes-area").append(
            $("<button/>", {
                id: "apply-changes",
                class: "btn btn-main position-absolute end-0",
                text: "Apply Changes",
                disabled: true,
            })
        );

        // Mark checkbox and update state
        $(document).on("click", ".action-checkbox", function () {
            // Remove the success message
            $("#success_message").text("");

            currentActionID = parseInt($(this).data("action-id"));
            currentActionType = $(this).data("action-type");

            currentAction = changesMade[currentActionID];
            originalAction = {
                ...actions.find((act) => act.id === currentActionID),
            };

            // If there are no changes made to this button yet add it to the changed buttons
            if (!currentAction) {
                changesMade[currentActionID] = { ...originalAction };
                totalChanges.add("Actions");
                enableApplyChangesButton();
            }
            // Change the state of the action that we are on
            if (currentActionType === "block")
                changesMade[currentActionID].block =
                    !changesMade[currentActionID].block;
            else if (currentActionType === "alert")
                changesMade[currentActionID].alert =
                    !changesMade[currentActionID].alert;

            // Remove the changed button if it returned to the original state
            if (
                changesMade[currentActionID].block === originalAction.block &&
                changesMade[currentActionID].alert === originalAction.alert
            ) {
                delete changesMade[currentActionID];
                if (Object.keys(changesMade).length === 0)
                    totalChanges.delete("Actions");
                if (totalChanges.size === 0) disableApplyChangesButton();
            }
        });

        function loadExtentions() {
            function blacklistExt() {
                const $policyRow = $(`#policy-row-${blacklistID}`);

                // Add title
                $("<div/>", {
                    class: "boldText text-dark bg-white",
                    html: "Blacklists:",
                }).appendTo($policyRow);

                // Add a table where each row has a list for this module
                $tableBody = $("<tbody/>").appendTo(
                    $("<table/>", {
                        class: "table table-borderless",
                    }).appendTo($policyRow)
                );

                // Add the lists to the table
                Object.keys(blacklistFields).forEach((fieldId) => {
                    $row = $("<tr>")
                        .append($("<td/>").html(blacklistFields[fieldId]))
                        .appendTo($tableBody);

                    $("<td/>")
                        .append(
                            $("<button/>", {
                                class: "btn btn-main open-popup-btn",
                                text: "Modify List",
                                "data-field-id": fieldId,
                            })
                        )
                        .appendTo($row);
                });
            }
            blacklistExt();
        }

        // Apply the changes of the changed policy
        $("#apply-changes").click(function () {
            // Handle the toggle action (on/off) for the module by sending the server the update
            if (changedModules.length > 0)
                $.ajax({
                    url: "/enum_modules/update",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(changedModules),
                    success: function (res) {
                        // Add a success message
                        $("#success_message").text(
                            "Policy updated successfully"
                        );

                        // Reset the list of modules and the apply button
                        changedModules = [];
                        totalChanges.delete("Modules");
                    },
                    error: function (res) {
                        if (res.status == 401) {
                            window.location.href = "/login";
                        }
                        if (res.responseJSON && res.responseJSON.error) {
                            $("#error_message").text(res.responseJSON.error);
                        }
                    },
                });

            // Send to the server the changes in the actions
            listOfUpdatedObjects = Object.values(changesMade);
            if (listOfUpdatedObjects.length > 0)
                $.ajax({
                    url: "/actions",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(listOfUpdatedObjects),
                    success: function (res) {
                        // Load the changes locally to enable a continuation
                        let newActions = [];
                        actions.forEach((act) => {
                            if (changesMade[act.id])
                                newActions.push(changesMade[act.id]);
                            else newActions.push(act);
                        });
                        actions = [...newActions];

                        // Add a success message
                        $("#success_message").text(
                            "Policy updated successfully"
                        );

                        // Reset the list of changes made and the button
                        changesMade = {};
                        totalChanges.delete("Actions");
                    },
                    error: function (res) {
                        if (res.status == 401) {
                            window.location.href = "/login";
                        }
                        if (res.responseJSON && res.responseJSON.error) {
                            $("#error_message").text(res.responseJSON.error);
                        }
                    },
                });

            // Load the data for blacklists after the removal if there's anything to remove.
            let loadDataAfterAdd = false;
            if (removeFromBlacklist.length === 0)
                loadDataAfterAdd = true;

            if (addToBlacklist.length > 0)
                $.ajax({
                    url: "/blacklist/add",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(addToBlacklist),
                    success: function (res) {
                        // Load the changes locally to enable a continuation
                        if (loadDataAfterAdd)
                            loadBlacklistValues();

                        // Add a success message
                        $("#success_message").text(
                            "Policy updated successfully"
                        );

                        // Reset the list of changes made and the button
                        addToBlacklist = [];
                        totalChanges.delete("Blacklist");
                    },
                    error: function (res) {
                        if (res.status == 401) {
                            window.location.href = "/login";
                        }
                        if (res.responseJSON && res.responseJSON.error) {
                            $("#error_message").text(res.responseJSON.error);
                        }
                    },
                });

            if (removeFromBlacklist.length > 0)
                $.ajax({
                    url: "/blacklist/remove",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(removeFromBlacklist),
                    success: function (res) {
                        // Load the changes locally to enable a continuation
                        loadBlacklistValues();

                        // Add a success message
                        $("#success_message").text(
                            "Policy updated successfully"
                        );

                        // Reset the list of changes made and the button
                        removeFromBlacklist = true;
                        totalChanges.delete("Blacklist");
                    },
                    error: function (res) {
                        if (res.status == 401) {
                            window.location.href = "/login";
                        }
                        if (res.responseJSON && res.responseJSON.error) {
                            $("#error_message").text(res.responseJSON.error);
                        }
                    },
                });

            disableApplyChangesButton();
        });

        // Load every module with an extension
        loadExtentions();
    }

    $modulesTable.on("click", ".toggle-btn", function (e) {
        // Prevent the row click from triggering
        e.stopPropagation();

        const moduleID = parseInt(
            $(this)
                .attr("id")
                .substr(togglePrefix.length + 1)
        );

        // Update the local state
        currentModule = modules.find((mod) => mod.id === moduleID);
        currentModule.enabled = !currentModule.enabled;

        // Update the list that will be sent to the server
        const index = changedModules.findIndex((mod) => mod.id === moduleID);
        if (index !== -1) changedModules.splice(index, 1);
        else
            changedModules.push({
                id: moduleID,
                enabled: currentModule.enabled,
            });

        // Remove the success message
        $("#success_message").text("");

        if (changedModules.length > 0) totalChanges.add("Modules");
        else totalChanges.delete("Modules");

        if (totalChanges.size > 0) enableApplyChangesButton();
        else disableApplyChangesButton();
    });

    $modulesTable.on("click", ".module-row", function (e) {
        // Prevent the row click from triggering when pressing the enable button
        if (!$(e.target).hasClass("toggle-btn-span"))
            $(this).next(".module-detail").toggle();
    });

    function loadData() {
        Promise.all([
            loadModules(),
            loadVerdicts(),
            loadActions(),
            loadBlacklistFields(),
            loadBlacklistValues(),
        ]).then(loadPage);
    }

    loadingAnimation();
    loadData();
    removeLoading();
});
