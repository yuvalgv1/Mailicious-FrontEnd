let fields = {};
let groupByField = null;
let chartsData = [];
let sendData = {};
let filtersCount = 0;
let previousValue = null;
let oneFilterOption = ["bool", "datetime"];

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
                    } else if (key == "id") {
                        fields[key] = "number";
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
                        class: "card-header d-flex justify-content-between align-item-center bg-main-color",
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
                    }).append(
                        $("<canvas/>", {
                            id: `chart-${chart.id}`,
                        })
                    )
                )
        )
    );

    // Load the chart in the middle of the card
    var chartData = chart.data;
    var listOfValues = chartData.count;
    var chartType = chart.type.toLowerCase();

    // Get all the keys excluding "count"
    let keys = Object.keys(chartData).filter((key) => key !== "count");

    // Function to truncate strings in arrays to 20 characters with "..."
    if (chartType === "bar")
        keys.forEach((key) => {
            if (Array.isArray(chartData[key])) {
                chartData[key] = chartData[key].map((value) => {
                    // Check if the value is a string before slicing
                    return typeof value === "string" && value.length > 20
                        ? value.slice(0, 20) + "..."
                        : value;
                });
            }
        });

    let combinedKeys = keys.join(":");
    let chartGuide = "";
    if (keys.length > 1) chartGuide = `Group By "${combinedKeys}"`;
    else chartGuide = `Group By ${combinedKeys}`;

    let dataKeys = [];

    let length = chartData[keys[0]].length; // Assuming all non-count arrays have the same length
    for (let i = 0; i < length; i++) {
        let combined = keys.map((key) => chartData[key][i]).join(":");
        dataKeys.push(combined);
    }

    const colors = [
        "#FF0000", // Bright Red-Orange
        "#33FF57", // Bright Green
        "#5733FF", // Bright Blue-Violet
        "#FF33F6", // Bright Pink
        "#33FFF6", // Bright Aqua
        "#F6FF33", // Bright Yellow
        "#8B4513", // Brown
        "#C0C0C0", // Silver
        "#000000", // Black
        "#FF3380", // Bright Magenta
        "#3380FF", // Bright Blue
        "#80FF33", // Lime Green
        "#FF8333", // Orange
        "#33A1FF", // Sky Blue
        "#A1FF33", // Yellow-Green
        "#FF33A1", // Hot Pink
        "#33FF83", // Mint Green
        "#F633FF", // Neon Purple
        "#FF6A33", // Tangerine
        "#FFD700", // Gold
    ];

    var xValues = dataKeys;
    var yValues = listOfValues;
    var barColors = [...Array(dataKeys.length)].map(
        (_, i) => colors[i % colors.length]
    );
    var isRounded = chartType === "pie" || chartType === "doughnut";

    let chartOptions = {
        legend: { display: isRounded },
        title: {
            display: true,
            text: chartGuide,
        },
    };

    if (chartType === "bar")
        chartOptions["scales"] = {
            yAxes: [
                {
                    ticks: {
                        beginAtZero: true,
                    },
                },
            ],
        };

    // Create the chart
    new Chart(`chart-${chart.id}`, {
        type: chartType,
        data: {
            labels: xValues,
            datasets: [
                {
                    backgroundColor: barColors,
                    data: yValues,
                },
            ],
        },
        options: chartOptions,
    });
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
        if (value !== "datetime" && key !== "id" && key != "content") {
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
    $filterRowsContainer = $("<div/>", {
        id: "dynamic-container",
    }).appendTo($filterSection);
    $filterSection.append(
        $("<button/>", {
            id: "add-field-btn",
            class: "btn btn-main",
            text: "+",
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
        )
        .append(
            $("<input/>", {
                type: "radio",
                id: "chartDoughnut",
                name: "chartType",
                value: "doughnut",
            })
        )
        .append(
            $("<label/>", {
                class: "me-3",
                for: "chartDoughnut",
                text: "Doughnut Chart",
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
    let allFieldsValid = true;
    document.querySelectorAll(".field-select").forEach((selectElement) => {
        const fieldId = selectElement.getAttribute("data-field-id");
        const selectedField = selectElement.value;

        // Check if the dropdown is filled
        if (!selectedField) {
            allFieldsValid = false;
            $("#modal_error").text(
                "You left a didn't slected fields on all of the filters"
            );
            return;
        }

        const inputContainer = document.querySelector(
            `#${fieldId} .input-container`
        );
        const inputElement = inputContainer.querySelector("input, select");

        // Get input value and filter out empty inputs
        let inputValue = inputElement ? inputElement.value : null;
        if (inputValue !== null && inputValue.trim() !== "") {
            // Add to sendData object
            if (!sendData[selectedField]) {
                if (oneFilterOption.includes(selectedField))
                    sendData[selectedField] = "";
                sendData[selectedField] = [];
            }
            if (oneFilterOption.includes(fields[selectedField]))
                sendData[selectedField] = inputValue;
            else if (inputElement.type === "number")
                sendData[selectedField].push(parseInt(inputValue));
            else sendData[selectedField].push(inputValue);
        }
    });

    if (!allFieldsValid) {
        return;
    }

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
            let chart = response;
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
            if (res.responseJSON) $("#modal_error").text(res.statusText);
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

// Add filter to modal
$(document).on("click", "#add-field-btn", function () {
    // Add filter only if the field can accept more than one value
    filtersCount++;
    const fieldId = `field-${filtersCount}`;

    // Add the new filter section
    $filterContainer = $("<div/>", {
        id: fieldId,
        class: "row mb-3",
    }).appendTo($("#dynamic-container"));

    $select = $("<select/>", {
        class: "form-select field-select",
        "data-field-id": fieldId,
    }).appendTo(
        $("<div/>", {
            class: "col-4",
        }).appendTo($filterContainer)
    );

    // Add a placeholder for the field selector
    $select.append(
        $("<option/>", {
            value: "",
            text: "Select a field",
        })
            .prop("disabled", true)
            .prop("selected", true)
    );

    Object.keys(fields).forEach((field) => {
        $opt = $("<option/>", {
            value: field,
            text: prettyDisplayFields(field),
        }).appendTo($select);

        // If there's already an option that can only have one value then disable the option
        if (
            oneFilterOption.includes(fields[field]) &&
            $(".field-select").filter(function () {
                return $(this).val() === field;
            }).length > 0
        )
            $opt.attr("disabled", true);
    });

    $("<div/>", {
        class: "col-6",
    })
        .append(
            $("<div/>", {
                class: "input-container",
            })
        )
        .appendTo($filterContainer);

    $("<div/>", {
        class: "col",
    })
        .append(
            $("<button/>", {
                class: "btn btn-danger filter-remove-btn",
                text: "-",
                "data-field-id": fieldId,
            })
        )
        .appendTo($filterContainer);
});

// Renove a filter from the screen
$(document).on("click", ".filter-remove-btn", function () {
    $(`#${$(this).data("field-id")}`).remove();
});

$(document).on("focus", ".field-select", function () {
    previousValue = $(this).val();
});

// Handle a change in the field select
$(document).on("change", ".field-select", function () {
    const fieldId = $(this).data("field-id");
    const selectedField = $(this).val();
    const inputContainer = $(`#${fieldId} .input-container`);

    inputContainer.empty();

    // Remove disable options for a changed field
    if (oneFilterOption.includes(fields[previousValue])) {
        const anySingleFilterSelected =
            $(".field-select").filter(function () {
                return $(this).val() === previousValue;
            }).length > 0;

        if (!anySingleFilterSelected) {
            $(".field-select")
                .find(`option[value="${previousValue}"]`)
                .attr("disabled", false);
        }
    }

    // Disable the option to pick the current option if its a one option possible type of field
    if (oneFilterOption.includes(fields[selectedField])) {
        $(".field-select")
            .not(`[data-field-id=${fieldId}]`)
            .find(`option[value="${selectedField}"]`)
            .attr("disabled", true);
    }

    previousValue = selectedField;

    // Add appropriate input based on the field type
    if (fields[selectedField] === "str") {
        inputContainer.append(
            $("<input/>", {
                type: "text",
                class: "form-control",
                placeholder: "Enter text",
            })
        );
    } else if (fields[selectedField] === "number") {
        inputContainer.append(
            $("<input/>", {
                type: "number",
                class: "form-control",
            })
        );
    } else if (fields[selectedField] === "bool") {
        inputContainer.append(
            $("<select/>", {
                class: "form-select",
            })
                .append(
                    $("<option/>", {
                        value: true,
                        text: "True",
                    })
                )
                .append(
                    $("<option/>", {
                        value: false,
                        text: "False",
                    })
                )
        );
    } else if (fields[selectedField] === "datetime") {
        inputContainer.append(
            $("<input/>", {
                type: "datetime-local",
                class: "form-control",
            })
        );
    }
});

// Execute the function once the page is loaded
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
