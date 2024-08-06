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
    let blacklists = [];
    let blacklistFields = [];
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
        $(".action-checkbox").click(function () {
            // Remove the success message
            $("#success-message").text("");

            currentActionID = parseInt($(this).attr("data-actionID"));
            currentActionType = $(this).attr("data-actionType");

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

                // Add a table where each row has a list for this module
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
        Promise.all([loadModules(), loadVerdicts(), loadActions()])
            .then(loadPage)
            .catch((error) => {
                $("#error_message").text(`Failed to fetch data: ${error}`);
            });
    }

    loadingAnimation();
    loadData();
    removeLoading();
});
