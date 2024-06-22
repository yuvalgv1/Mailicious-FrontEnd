$(document).ready(function () {
    // Expand the menu
    $(".menu-btn").click(function () {
        $("#sidebar-navbar").toggleClass("expanded");
        $(".nav-text").toggleClass("d-none");
    });

    // Get the user name
    $.ajax({
        url: '/users',
        type: "GET",
        dataType: "json",
        data: { id: localStorage.getItem("userId"), },
        success: function (res) {
            $(".profile-name").text(res.full_name)
        },
        error: function (res) {
            $(".profile-name").text("")
        },
    });
});
