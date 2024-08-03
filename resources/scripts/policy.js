// /scripts/policy.js
$(document).ready(function () {
    let togglePrefix = "toggle-btn";
    const modules = ["Module1", "Module2", "Module3"]; // Replace this with your actual list of modules
    const verdicts = [0, 1, 2];

    const $modulesTable = $("#modules_table tbody");

        

    modules.forEach((module) => {
        // Add the row for each module
        const $row = $("<tr>", {
            class: "module-row",
        });

        $("<td/>", {
            html: module,
        }).appendTo($row);

        $("<td/>", {
            class: "d-flex justify-content-end",
        })
            .append(
                $("<label/>", {
                    class: "switch",
                })
                    .append(
                        $("<input/>", {
                            id: `${togglePrefix}-${module}`,
                            type: "checkbox",
                            class: "toggle-btn",
                        })
                    )
                    .append(
                        $("<span/>", {
                            class: "slider round",
                        })
                    )
            )
            .appendTo($row);

        $modulesTable.append($row);

        // Add an expantion row below each row
        const $exp = $("<tr>", {
            class: "module-detail bg-white",
        });

        

        // In each module there's a classification with actions

    });

    $modulesTable.on("click", ".module-row", function () {
        $(this).next(".module-detail").toggle();
    });

    $modulesTable.on("click", ".toggle-btn", function (e) {
        e.stopPropagation(); // Prevent the row click from triggering
        const moduleName = $(this)
            .attr("id")
            .substr(togglePrefix.length + 1);
        // Handle the toggle action (on/off) for the module
        
    });
});
