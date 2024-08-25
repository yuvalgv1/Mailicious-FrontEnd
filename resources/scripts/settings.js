let users = [];
let properties = new Set();
let userIdToDelete = null;

function setProperties() {
    properties = new Set();
    users.forEach((u) => {
        Object.keys(u).forEach((key) => properties.add(key));
    });
}

function getPrettyFormat(value) {
    valueParts = value.split("_");
    for (let i = 0; i < valueParts.length; i++)
        valueParts[i] =
            valueParts[i].charAt(0).toUpperCase() + valueParts[i].slice(1);
    return valueParts.join(" ");
}

function addTableHeaders() {
    // Add headers for the table
    let $thead = $("<thead/>").appendTo($table);
    let $headerRow = $("<tr/>", {
        id: "table-head-row",
    }).appendTo($thead);

    properties.forEach((prop) => {
        if (prop != "id") {
            let $th = $("<th/>", {
                scope: "col",
            }).appendTo($headerRow);

            // Add field text
            $("<span/>", {
                text: getPrettyFormat(prop),
            }).appendTo($th);
        }
    });

    // Add another column for the buttons of actions
    $("<th/>", {
        scope: "col",
    }).appendTo($headerRow);
}

function addTableData() {
    // Add data
    $tableBody = $table.append(
        $("<tbody/>", {
            class: "table-group-divider",
        })
    );

    users.forEach((user) => {
        const $row = $("<tr>");

        properties.forEach((prop) => {
            if (prop != "id") {
                cellText = user[prop];
                $row.append($("<td>").text(cellText));
            }
        });

        $actionButton = $("<button/>", {
            "data-user-id": user.id,
            "data-full-name": user.full_name,
        });

        let myUserID = parseInt(localStorage.getItem("userId"));
        if (user.id === myUserID) {
            $actionButton
                .addClass("btn btn-main reset-pass")
                .text("Reset Password");
        } else {
            $actionButton
                .addClass("btn btn-danger delete-user")
                .text("Delete User");
        }

        $actionButton.appendTo(
            $("<div/>", {
                class: "d-flex justify-content-end",
            }).appendTo($("<td>").appendTo($row))
        );
        $row.appendTo($tableBody);
    });
}

function updateUsersTable() {
    // Enter the data from the table
    $table = $("#users_table");
    $table.empty();

    addTableHeaders();
    addTableData();
}

function getUsers() {
    $.ajax({
        url: "/users",
        type: "GET",
        success: function (response) {
            $("#error_message").text("");
            users = response;
            users.forEach((user) => {
                delete user.is_active;
            });
            setProperties();
            updateUsersTable();
        },
        error: function (res) {
            if (res.status == 401) window.location.href = "/login";
            if (res.responseJSON && res.responseJSON.error)
                $("#error_message").text(res.responseJSON.error);
        },
    });
}

$(document).on("click", "#addUser", function () {
    $("#success_message").text("");
    $("#newUserError").addClass("d-none");
    $("#newUserEmail").val("");
    $("#newUserName").val("");
    $("#newUserPassword").val("");
    $("#addUserModal").modal("show");
});

$(document).on("click", "#addUserSubmit", function () {
    const email = $("#newUserEmail").val();
    const full_name = $("#newUserName").val();
    const password = $("#newUserPassword").val();
    $("#newUserError").addClass("d-none");

    $.ajax({
        url: "/users/add",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            email: email,
            full_name: full_name,
            password: password,
        }),
        success: function (res) {
            $("#addUserModal").modal("hide");
            $("#success_message").text("User created successfully");
            const { id } = res;
            users.push({ id: id, email: email, full_name: full_name });
            updateUsersTable();
        },
        error: function (res) {
            $("#newUserError")
                .removeClass("d-none")
                .text(res.responseJSON.error);
        },
    });
});

$(document).on("click", ".reset-pass", function () {
    $("#success_message").text("");
    $("#passwordError").addClass("d-none");
    $("#oldPassword").val("");
    $("#newPassword").val("");
    $("#confirmPassword").val("");
    $("#changePasswordModal").modal("show");
});

$(document).on("click", "#submitPasswordChange", function () {
    const oldPassword = $("#oldPassword").val();
    const newPassword = $("#newPassword").val();
    const confirmPassword = $("#confirmPassword").val();

    if (newPassword !== confirmPassword) {
        $("#passwordError")
            .removeClass("d-none")
            .text("Error changing password. Please try again.");
    } else {
        $("#passwordError").addClass("d-none");

        $.ajax({
            url: "/users/reset",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword,
            }),
            success: function (response) {
                $("#changePasswordModal").modal("hide");
                $("#success_message").text("Password changed successfully");
            },
            error: function (res) {
                $("#passwordError")
                    .removeClass("d-none")
                    .text(res.responseJSON.error);
            },
        });
    }
});

$(document).on("click", ".delete-user", function () {
    $("#success_message").text("");
    $("#deleteUserError").addClass("d-none");
    userIdToDelete = $(this).data("user-id");
    const fullName = $(this).data("full-name");
    $("#confirmationMessage").text(
        `Are you sure you want to delete ${fullName}?`
    );
    $("#confirmationModal").modal("show");
});

$(document).on("click", "#confirmDelete", function () {
    if (userIdToDelete !== null) {
        $("#deleteUserError").addClass("d-none");
        $.ajax({
            url: "/users/delete",
            type: "POST",
            data: {
                id: userIdToDelete,
            },
            success: function (response) {
                $("#confirmationModal").modal("hide");
                $("#success_message").text("User deleted successfully.");
                users = users.filter((user) => user.id !== userIdToDelete);
                updateUsersTable();
            },
            error: function (res) {
                $("#deleteUserError")
                    .removeClass("d-none")
                    .text(res.responseJSON.error);
            },
        });
    }
});

$(document).ready(function () {
    $("#changePasswordModal").appendTo($("body"));
    $("#confirmationModal").appendTo($("body"));
    $("#addUserModal").appendTo($("body"));
    getUsers();
});
