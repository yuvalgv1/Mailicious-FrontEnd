function removeLoading(button, button_text) {
    // This function reset the button from the loading mode.
    if (button.prop("disabled")) {
        button.removeClass("bg-warning");
        button.prop("disabled", false);
        button.html(button_text);
    }
}

$("form").on("submit", function (event) {
    // Change button state to "Loading"
    submit_button = $(this).find("button");
    button_text = submit_button.text();
    submit_button.prop("disabled", true);
    submit_button.addClass("bg-warning");
    submit_button.text("");
    submit_button.append(
        $("<span/>", {
            class: "spinner-border spinner-border-sm",
            role: "status",
        })
    );
    submit_button.append(" Loading...");

    // Prevent from the original action
    event.preventDefault();

    $.ajax({
        url: $(this).attr("action"),
        type: "POST",
        data: {
            username: "detection_server@mailicious.com",
            password: "detection_server_password",
        },
        success: function (res) {
            path = sessionStorage.getItem("redirect_path");
            sessionStorage.removeItem("redirect_path");
            console.log(res.id);
            localStorage.setItem("userId", res.id);
            if (path) {
                window.location.href = path;
            } else {
                window.location.href = "/";
            }
        },
        error: function (res) {
            if (res.responseJSON && res.responseJSON.error) {
                $("#error_message").text(res.responseJSON.error);
                $("#error_message").addClass("container p-3");
            }
            removeLoading(submit_button, button_text);
        },
    });
});
