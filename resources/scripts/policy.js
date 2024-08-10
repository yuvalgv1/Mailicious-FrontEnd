$(document).ready(function () {
    let modules = [];
    let verdicts = [];
    let actions = [];

    let togglePrefix = "toggle-btn";
    const mainPolicyID = 1;
    const benignID = 1;
    let changesMade = {};
    let changedModules = [];

    // Blacklist module variables
    const blacklistID = 3;
    let blacklistFields = {};
    let blacklistsValues = {};
    let addToBlacklist = [];
    let removeFromBlacklist = [];

    const $modulesTable = $("#modules_table tbody");

    // Add loading message when waiting for the server to send the data.
    function loadingAnimation() {
        $("#loading-message")
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
        $("#loading-message").html("");
    }

    // Change state of the apply changes button.
    function enableApplyChangesButton() {
        $("#apply-changes")
            .removeClass("btn-secondary")
            .addClass("btn-primary")
            .prop("disabled", false);
    }

    // Change state of the apply changes button.
    function disableApplyChangesButton() {
        $("#apply-changes")
            .addClass("btn-secondary")
            .removeClass("btn-primary")
            .prop("disabled", true);
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
        let fields = [
            { name: "domain", id: 1 },
            { name: "subject", id: 2 },
            { name: "SPF_IP", id: 3 },
            { name: "country", id: 4 },
        ];

        fields.forEach((field) => {
            blacklistFields[field.id] = field.name;
        });
    }

    // Load the values to input the blacklist module
    function loadBlacklistValues() {
        let fullList = [
            { id: 0, field_id: 1, value: "test value" },
            { id: 1, field_id: 2, value: "test value1" },
            { id: 2, field_id: 2, value: "test value2" },
        ];

        fullList.forEach((value) => {
            const { field_id, ...rest } = value;
            if (!(field_id in blacklistsValues))
                blacklistsValues[field_id] = [];
            blacklistsValues[field_id].push(rest);
        });
    }

    function renderBlacklist(fieldId) {
        var list = $(`#list-${fieldId}`);
        list.empty();
        var valuesInList = blacklistsValues[fieldId];
        if (valuesInList) {
            valuesInList.forEach((entry) => {
                list.append(
                    $("<li/>", {
                        class: "list-group-item d-flex justify-content-between align-items-center",
                        text: entry.value,
                    }).append(
                        $("<button/>", {
                            class: "btn btn-danger btn-sm remove-btn",
                            text: "Remove",
                            "data-field-id": fieldId,
                        })
                    )
                );
            });
        }
    }

    // Add new value to the list
    $(document).on("click", ".add-value-btn", function () {
        var fieldId = $(this).data("field-id");
        const newValue = $(`#newListValueInput-${fieldId}`).val().trim();

        // Clear input field
        $(`#newListValueInput-${fieldId}`).val("");

        if (newValue) {
            var currentList = blacklistsValues[fieldId];

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
                        field_id: fieldId,
                    };
                    addToBlacklist.push(newEntry);
                    currentList.push(newEntry);
                } else {
                    const [RevivedEntry] = removeFromBlacklist.splice(index, 1);
                    currentList.push(RevivedEntry);
                }

                renderBlacklist(fieldId);
            }
        }
    });

    // Remove value from the list
    $(document).on("click", ".remove-btn", function () {
        const fieldId = $(this).data("field-id");
        const removedValue = $(this)
            .parent()
            .contents()
            .filter(function () {
                return this.nodeType === Node.TEXT_NODE;
            })
            .text();
        var currentList = blacklistsValues[fieldId];

        // Remove the entry from the current list
        var index = currentList.findIndex((obj) => obj.value === removedValue);
        const [removedObject] = currentList.splice(index, 1);

        // Remove only objects that exists in the database
        if (removedObject.hasOwnProperty("id")) {
            removeFromBlacklist.push(removedObject);
        }

        // Remove the entry from added values if its a new value
        index = addToBlacklist.findIndex((obj) => obj.value === removedValue);

        if (index === -1) addToBlacklist.splice(index, 1);

        renderBlacklist(fieldId);
    });

    // Open list popup when the button is clicked
    $(document).on("click", ".open-popup-btn", function () {
        $(`#${$(this).data("modal-id")}`).modal("show");
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
                                        "data-actionID": act.id,
                                        "data-actionType": "block",
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
                                        "data-actionID": act.id,
                                        "data-actionType": "alert",
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
                class: "btn btn-secondary position-absolute end-0",
                text: "Apply Changes",
                disabled: true,
            })
        );

        // Mark checkbox and update state
        $(document).on("click", ".action-checkbox", function () {
            // Remove the success message
            $("#success-message").text("");

            currentActionID = parseInt($(this).data("actionID"));
            currentActionType = $(this).data("actionType");

            currentAction = changesMade[currentActionID];
            originalAction = {
                ...actions.find((act) => act.id === currentActionID),
            };

            // If there are no changes made to this button yet add it to the changed buttons
            if (!currentAction) {
                changesMade[currentActionID] = { ...originalAction };
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
                    disableApplyChangesButton();
            }
        });

        function loadExtentions() {
            function blacklistExt() {
                const $policyRow = $(`#policy-row-${blacklistID}`);

                // Add a seperator line
                $policyRow.append($("<hr/>", { class: "bg-white" }));

                // Add title
                $("<div/>", {
                    class: "boldText bg-white",
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
                                class: "btn btn-primary open-popup-btn",
                                text: "Modify List",
                                "data-modal-id": `list-popup-${fieldId}`,
                            })
                        )
                        .appendTo($row);
                    $("body").append(
                        $("<div/>", {
                            class: "modal fade",
                            id: `list-popup-${fieldId}`,
                            tabindex: "-1",
                            "aria-labelledby": "listPopupLabel",
                            "aria-hidden": "true",
                            role: "dialog",
                        }).append(
                            $("<div/>", {
                                class: "modal-dialog modal-dialog-centered modal-dialog-scrollable",
                                role: "document",
                            }).append(
                                $("<div/>", {
                                    class: "modal-content",
                                })
                                    .append(
                                        $("<div/>", {
                                            class: "modal-header",
                                        })
                                            .append(
                                                $("<h5/>", {
                                                    class: "modal-title",
                                                    text: "List Editor",
                                                })
                                            )
                                            .append(
                                                $("<button/>", {
                                                    type: "button",
                                                    class: "btn-close",
                                                    "data-bs-dismiss": "modal",
                                                    "aria-label": "Close",
                                                })
                                            )
                                    )
                                    .append(
                                        $("<div/>", {
                                            class: "modal-body",
                                        })
                                            .append(
                                                $("<div/>", {
                                                    class: "mb-3",
                                                })
                                                    .append(
                                                        $("<input/>", {
                                                            type: "text",
                                                            id: `newListValueInput-${fieldId}`,
                                                            class: "form-control",
                                                            placeholder:
                                                                "Enter a new value",
                                                        })
                                                    )
                                                    .append(
                                                        $("<button/>", {
                                                            class: "btn btn-primary mt-2 add-value-btn",
                                                            text: "Add Value",
                                                            "data-field-id":
                                                                fieldId,
                                                        })
                                                    )
                                            )
                                            .append(
                                                $("<ul/>", {
                                                    id: `list-${fieldId}`,
                                                    class: "list-group",
                                                })
                                            )
                                    )
                            )
                        )
                    );
                    // Initial rendering of the list
                    renderBlacklist(fieldId);
                });
            }
            blacklistExt();
        }

        // Apply the changes of the changed policy
        $("#apply-changes").click(function () {
            // Handle the toggle action (on/off) for the module by sending the server the update
            if (changedModules.length > 0)
                $.ajax({
                    url: "/modules/toggle",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(changedModules),
                    success: function (res) {
                        // Add a success message
                        $("#success-message").text(
                            "Policy updated successfully"
                        );

                        // Reset the list of modules and the apply button
                        changedModules = [];
                        disableApplyChangesButton();
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
                        $("#success-message").text(
                            "Policy updated successfully"
                        );

                        // Reset the list of changes made and the button
                        changesMade = {};
                        disableApplyChangesButton();
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

            // Handle changes in blacklist module
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

        if (changedModules.includes(moduleID))
            changedModules = changedModules.filter((e) => e !== moduleID);
        else changedModules.push(moduleID);

        // Update the local state
        currentModule = modules.find((mod) => mod.id === moduleID);
        currentModule.enabled = !currentModule.enabled;

        // Remove the success message
        $("#success-message").text("");

        if (changedModules.length === 0) disableApplyChangesButton();
        else enableApplyChangesButton();
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
