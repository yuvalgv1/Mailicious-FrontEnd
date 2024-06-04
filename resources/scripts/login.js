function removeLoading(button, button_text) {
    // This function reset the button from the loading mode.
    if (button.prop("disabled")) {
        button.removeClass("bg-warning")
        button.prop("disabled", false)
        button.html(button_text)
    }
}

$('form').on("submit", function (event) {
    // Change button state to "Loading"
    submit_button = $(this).find('button')
    button_text = submit_button.text()
    submit_button.prop("disabled", true)
    submit_button.addClass("bg-warning")
    submit_button.text("")
    submit_button.append($('<span/>', {
        class: "spinner-border spinner-border-sm",
        role: "status"
    }))
    submit_button.append(" Loading...")

    // Prevent from the original action
    event.preventDefault();

    $.ajax({
        url: $(this).attr("action"),
        type: $(this).attr("method").toUpperCase(),
        dataType: 'json',
        data: $(this).serialize(), // Send the entire form data as JSON
        success: function (res) {
            // TODO: add the forwarding to the next page (the one requested)
        },
        error: function (res) {
            if (res.responseJSON && res.responseJSON.message) {
                $('#error_message').text(res.responseJSON.message);
                $('#error_message').addClass("container p-3")
            }
            removeLoading(submit_button, button_text)
        },
    })

})