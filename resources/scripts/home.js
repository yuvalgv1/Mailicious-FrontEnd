$(document).ready(function () {
    let graphCounter = 0;

    $("body").append($("#graphConfigModal"));

    // Function to get possible fields (example)
    function getFields() {
        return {
            sender: "str",
            from_time: "datetime",
            subject: "str",
            // Add more fields as needed
        };
    }

    // Function to fetch data based on filters (example)
    function fetchData(filters) {
        // Placeholder for AJAX call to fetch data
        console.log("Fetching data with filters:", filters);
        return []; // Replace with actual data
    }

    // Add filter field dynamically
    $("#add-filter-btn").click(function () {
        const fields = getFields();
        const filterFieldHtml = `
            <div class="form-group filter-group">
                <label for="filter-field">Filter Field</label>
                <select class="form-control filter-field">
                    ${Object.keys(fields)
                        .map(
                            (field) =>
                                `<option value="${field}">${field}</option>`
                        )
                        .join("")}
                </select>
                <input type="text" class="form-control filter-value" placeholder="Enter value">
                <button type="button" class="btn btn-danger remove-filter-btn">Remove</button>
            </div>
        `;
        $("#filter-fields").append(filterFieldHtml);
    });

    // Remove filter field
    $(document).on("click", ".remove-filter-btn", function () {
        $(this).closest(".filter-group").remove();
    });

    // Add a new graph
    $("#add-graph-btn").click(function () {
        $("#graph-config-form")[0].reset();
        $("#graphConfigModal").modal("show");
    });

    // Save the configured graph
    $("#save-graph-btn").click(function () {
        const graphType = $("#graph-type").val();
        const groupBy = $("#group-by").val();
        const filters = {};

        // Collect filter values
        $(".filter-group").each(function () {
            const field = $(this).find(".filter-field").val();
            const value = $(this).find(".filter-value").val();
            if (field && value) {
                filters[field] = value;
            }
        });

        // Add group_by to filters if provided
        if (groupBy) {
            filters.group_by = [groupBy];
        }

        // Fetch data based on filters
        const data = fetchData(filters);

        // Generate graph container
        const graphHtml = `
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <button type="button" class="close remove-graph-btn" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        Graph ${++graphCounter}
                    </div>
                    <div class="card-body">
                        <canvas id="graph-${graphCounter}"></canvas>
                    </div>
                </div>
            </div>
        `;
        $("#graphs-container").append(graphHtml);

        // Render the chart
        const ctx = document
            .getElementById(`graph-${graphCounter}`)
            .getContext("2d");
        new Chart(ctx, {
            type: graphType,
            data: {
                // Placeholder data structure
                labels: [], // Add labels based on data
                datasets: [
                    {
                        label: `Graph ${graphCounter}`,
                        data: [], // Add data based on data
                        backgroundColor: "rgba(0, 123, 255, 0.5)",
                        borderColor: "rgba(0, 123, 255, 1)",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                scales: {
                    x: {
                        type: groupBy === "from_time" ? "time" : "category",
                        time: {
                            unit: "day",
                        },
                    },
                },
            },
        });

        $("#graphConfigModal").modal("hide");
    });

    // Remove a graph
    $(document).on("click", ".remove-graph-btn", function () {
        $(this).closest(".col-md-6").remove();
    });
});
