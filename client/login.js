function loginAccountSuccess(json)
{
    if (json.success == true)
    {
        dialog.dialog("close");
        location.reload();
    }
    else
        window.alert("Login and/or password are incorrect.");
}

function loginAccount()
{
    $.ajax("/login",
    {
        data:
        {
            login: $("#login-field").val(),
            password: $("#password-field").val()
        },
        dataType: "json",
        success: loginAccountSuccess,
        error: function(err)
        {
            window.alert("Could not query database.  Try again later.");
        }
    });
}

function doLogin()
{
	$("#login-field").val("");
	$("#password-field").val("");
    dialog = $("#login-form").dialog(
    {
        height: 400,
        width: 350,
        modal: true,
        buttons:
        {
            "Login": loginAccount,
			"Cancel": function() { dialog.dialog("close"); }
        }
    });
}

function doCreateNewLogin()
{
	$("#new-login-field").val("");
	$("#name-field").val("");
	$("#location-field").val("");
	$("#email-address-field").val("");
	$("#new-password-field").val("");
    dialog = $("#new-login-form").dialog(
    {
        height: 400,
        width: 350,
        modal: true,
        buttons:
        {
            "Create account": createNewAccount,
			"Cancel": function() { dialog.dialog("close"); }
        }
    });
}

function doLogout()
{
    $.ajax("/logout",
    {
        dataType: "json",
        success: function()
        {
            location.reload();
        },
        error: function(err)
        {
            window.alert("Something went wrong with the logout function");
        }
    });
}

function createNewAccountSuccess(json)
{
    if (json.success == true)
        location.reload();
    else
        window.alert("This account already exists.");
}

function createNewAccount()
{
    $.ajax("/createNewLogin",
    {
        data:
        {
            login: $("#new-login-field").val(),
			name: $("#name-field").val(),
			location: $("#location-field").val(),
			email: $("#email-address-field").val(),
            password: $("#new-password-field").val()
        },
        dataType: "json",
        success: createNewAccountSuccess,
        error: function()
        {
            window.alert("Could not update database.  Try again later.");
        }
    });
}

