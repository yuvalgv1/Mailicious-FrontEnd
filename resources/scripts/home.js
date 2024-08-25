let fields = {};
let groupByField = null;
let chartsData = [];
let sendData = {};

// Display fields names prettier
function prettyDisplayFields(field) {
    valueParts = field.split("_");
    if (valueParts[0] === "id") {
        valueParts[0] = "ID";
    }
    for (let i = 0; i < valueParts.length; i++)
        valueParts[i] =
            valueParts[i].charAt(0).toUpperCase() + valueParts[i].slice(1);
    return valueParts.join(" ");
}

// Get all fields supported by the server
function getMetaData() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "/search/group/meta",
            type: "GET",
            success: function (res) {
                groupByField = res[0];
                for (let i = 1; i < res.length; i++) {
                    let key = res[i];

                    // Apply rules for value assignment
                    if (key === "block" || key === "alert") {
                        fields[key] = "bool";
                    } else if (key.includes("time")) {
                        fields[key] = "datetime";
                    } else {
                        fields[key] = "str";
                    }
                }

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

// Get all the saved charts
function getCurrentCharts() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "/search/group/all",
            type: "GET",
            success: function (res) {
                chartsData = res;
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

// Add a chart to the screen
function displayChart(chart) {
    // Add the chart container first
    $("#charts-container").append(
        $("<div/>", {
            id: `ChartCont-${chart.id}`,
            class: "col-md-6 mb-4",
        }).append(
            $("<div/>", {
                class: "card text-center",
            })
                .append(
                    $("<div/>", {
                        class: "card-header d-flex justify-content-between align-item-center",
                    })
                        .append(
                            $("<h5>", {
                                class: "mx-auto mb-0",
                                text: chart.name,
                            })
                        )
                        .append(
                            $("<button/>", {
                                class: "close remove-chart-btn btn btn-danger text-dark justify-content-between",
                                title: "Delete Chart",
                                "data-id": chart.id,
                            }).append(
                                $("<i/>", {
                                    class: "fa-solid fa-trash",
                                })
                            )
                        )
                )
                .append(
                    $("<div/>", {
                        id: `chartBody-${chart.id}`,
                        class: "card-body",
                    })
                )
        )
    );

    // Load the chart in the middle of the card
}

// Add content to the modal
function populateCreationModal() {
    $modalBody = $(".modal-body").empty();

    // Add the name section
    $nameSection = $("<div/>", {
        class: "mb-3",
    }).appendTo($modalBody);
    $nameSection.append(
        $("<label/>", {
            text: "Please choose a name for the chart:",
        })
    );
    $nameSection.append(
        $("<div/>").append(
            $("<input/>", {
                id: "nameInput",
                type: "text",
                class: "form-control",
            })
        )
    );

    $modalBody.append($("<hr/>"));

    // Add the group by section
    $groupByFieldsSection = $("<div/>", {
        class: "mb-3",
    }).appendTo($modalBody);
    $groupByFieldsSection.append(
        $("<label/>", {
            text: "Choose fields to group by:",
        })
    );
    $groupByFieldsCheckboxes = $("<div/>", {
        id: "groupByFields",
    }).appendTo($groupByFieldsSection);
    Object.entries(fields).forEach(([key, value]) => {
        if (value !== "datetime") {
            $groupByFieldsCheckboxes.append(
                $("<div/>", {
                    class: "form-check",
                })
                    .append(
                        $("<input/>", {
                            class: "form-check-input",
                            type: "checkbox",
                            value: key,
                            id: `group-${key}`,
                        })
                    )
                    .append(
                        $("<label/>", {
                            class: "form-check-label",
                            for: `group-${key}`,
                            text: prettyDisplayFields(key),
                        })
                    )
            );
        }
    });

    $modalBody.append($("<hr/>"));

    // Add the filter section
    $filterSection = $("<div/>", {
        class: "mb-3",
    }).appendTo($modalBody);
    $filterSection.append(
        $("<label/>", {
            text: "You may choose filters:",
        })
    );

    $modalBody.append($("<hr/>"));

    // Add the chart type section
    $chartTypeSection = $("<div/>", {
        class: "mb-3",
    }).appendTo($modalBody);
    $chartTypeSection.append(
        $("<label/>", {
            text: "Choose the chart type:",
        })
    );
    $("<div/>")
        .appendTo($chartTypeSection)
        .append(
            $("<input/>", {
                type: "radio",
                id: "chartBar",
                name: "chartType",
                value: "bar",
            }).prop("checked", true)
        )
        .append(
            $("<label/>", {
                class: "me-3",
                for: "chartBar",
                text: "Bar Chart",
            })
        )
        .append(
            $("<input/>", {
                type: "radio",
                id: "chartPie",
                name: "chartType",
                value: "pie",
            })
        )
        .append(
            $("<label/>", {
                class: "me-3",
                for: "chartPie",
                text: "Pie Chart",
            })
        );
}

// Reset the modal values on opening
$(document).on("click", "#add-chart-btn", function () {
    populateCreationModal();
});

// Create a new chart
$(document).on("click", "#createChart", function () {
    $("#modal_error").empty();
    sendData = {};

    // Collect the name of the chart
    sendData["name"] = $("#nameInput").val();

    // Collect selected group-by fields
    const groupBy = [];
    $("#groupByFields input:checked").each(function () {
        groupBy.push($(this).val());
    });
    sendData[groupByField] = groupBy.join(",");
    if (groupBy.length === 0) {
        $("#modal_error").text("You must pick at least one field to group by.");
        return;
    }

    // Collect all filters

    // Save the requested type
    const radios = document.querySelectorAll('input[name="chartType"]');
    const selectedRadio = Array.from(radios).find((radio) => radio.checked);
    sendData["type"] = selectedRadio.value;

    // Send the data to the server to create the chart and get its data
    $.ajax({
        url: "/charts/create",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(sendData),
        success: function (response) {
            $("#modal_error").text("");

            // Load the new chart
            let chart = response
            chartsData.push(chart);
            displayChart(chart);

            // Close the modal
            const modalElement = document.querySelector(".modal");
            const modalInstance =
                bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.hide();

            removeLoading();
        },
        error: function (res) {
            if (res.status == 401) window.location.href = "/login";
            if (res.responseJSON && res.responseJSON.error)
                $("#modal_error").text(res.responseJSON.error);
            removeLoading();
        },
    });
});

// Delete Chart
$(document).on("click", ".remove-chart-btn", function () {
    loadingAnimation();
    $chartId = $(this).data("id");
    $.ajax({
        url: "/charts/delete",
        type: "POST",
        data: {
            id: $chartId,
        },
        success: function (response) {
            $("#error_message").text("");

            // Find the index of the object with the given id
            const index = chartsData.findIndex(
                (chart) => chart.id === $chartId
            );

            // If the object is found, remove it from the list
            if (index !== -1) {
                chartsData.splice(index, 1);
            }

            $(`#ChartCont-${$chartId}`).remove();

            removeLoading();
        },
        error: function (res) {
            if (res.status == 401) window.location.href = "/login";
            if (res.responseJSON && res.responseJSON.error)
                $("#error_message").text(res.responseJSON.error);
            removeLoading();
        },
    });
});

$(document).ready(function () {
    $("#chartModal").appendTo($("body"));
    loadingAnimation();
    // Load Data
    Promise.all([getMetaData(), getCurrentCharts()]).then(() => {
        removeLoading();

        chartsData.forEach((chart) => {
            displayChart(chart);
        });
    });
});

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
