$(document).ready(function() {
    const availableFields = ["field1", "field2", "field3", "field4", "field5"]; // Your actual fields here
    const $filterFields = $("#filterFields");
    const $groupByFields = $("#groupByFields");

    $("body").append($("#chartModal"));

    // Populate the filter and group-by fields with checkboxes
    availableFields.forEach(field => {
        // Add checkboxes for filtering
        $filterFields.append(`
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${field}" id="filter-${field}">
                <label class="form-check-label" for="filter-${field}">${field}</label>
            </div>
        `);

        // Add checkboxes for grouping
        $groupByFields.append(`
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${field}" id="group-${field}">
                <label class="form-check-label" for="group-${field}">${field}</label>
            </div>
        `);
    });

    // Handle form submission
    $("#chartForm").on("submit", function(e) {
        e.preventDefault();

        // Collect selected filter fields
        const filters = [];
        $("#filterFields input:checked").each(function() {
            filters.push($(this).val());
        });

        // Collect selected group-by fields
        const groupBy = [];
        $("#groupByFields input:checked").each(function() {
            groupBy.push($(this).val());
        });

        const chartType = $("input[name='chartType']:checked").val();

        // Ensure at least one group-by field is selected
        if (groupBy.length === 0) {
            alert("Please select at least one field to group by.");
            return;
        }

        // Send AJAX request with filters and group-by data
        $.ajax({
            url: "/charts/create",
            method: "POST",
            data: JSON.stringify({ filters, groupBy, chartType }),
            contentType: "application/json",
            success: function(response) {
                renderChart(response.data, chartType);
                saveChartId(response.id);
            },
            error: function(xhr) {
                alert("Error creating chart: " + xhr.responseText);
            }
        });
    });

    function renderChart(data, chartType) {
        // Implement chart rendering here
    }

    function saveChartId(chartId) {
        // Implement chart ID saving here
    }
});
