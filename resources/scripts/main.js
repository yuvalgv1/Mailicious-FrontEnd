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

    $("#logout").click(function () {
        const cookies = document.cookie.split(";");
        console.log(cookies);
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie =
                name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/logout";
    });

    // Route through the website
    $(".nav-btn").click(function () {
        window.location.href = $(this).data("path");
    });

    // Get the user name
    $.ajax({
        url: "/user",
        type: "GET",
        success: function (res) {
            localStorage.setItem("userId", res.id);
            $(".profile-name").text(res.full_name);
        },
        error: function (res) {
            if (res.status == 401) window.location.href = "/login";
            $(".profile-name").text("");
        },
    });
});
