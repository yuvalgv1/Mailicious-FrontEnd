$(document).ready(function () {
    let statement = "SELECT * FROM emails"

    function sendSQLStatement(statement) {
        $.ajax({
            url: '/search',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ query: statement }),
            // TODO: add table in success and print error in error
            success: function(response) {
                console.log('Success:', response);
            },
            error: function(error) {
                console.error('Error:', error);
            }
        });
    }

    sendSQLStatement(statement);
});