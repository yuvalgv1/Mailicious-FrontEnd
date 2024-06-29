$(document).ready(function () {
    let titleEnabled = true;

    // Expand the menu
    $(".menu-btn").click(function () {
        $("#sidebar-navbar").toggleClass("expanded");
        $(".nav-text").toggleClass("d-none");
        $(".settings-btn-container").toggleClass("me-auto mx-2");
        $(".nav-buttons").toggleClass("me-auto mx-2");

        // Add and remove titles for buttons when the menu collapse and expand.
        $(".nav-btn").each(function () {
            let $this = $(this);
            if (titleEnabled) {
                $this.removeAttr("title");
            } else {
                $this.attr("title", $this.data("title"));
            }
        });
        titleEnabled = !titleEnabled;
    });

    // Route through the website
    $(".nav-btn").click(function () {
        window.location.href = $(this).data("path");
    });

    // Get the user name
    $.ajax({
        url: "/user",
        type: "GET",
        dataType: "json",
        data: { id: localStorage.getItem("userId") },
        success: function (res) {
            $(".profile-name").text(res.full_name);
        },
        error: function (res) {
            if (res.status == 401)
                window.location.href = "/login";
            $(".profile-name").text("");
        },
    });
});
