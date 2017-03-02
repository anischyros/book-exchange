function makeOffer(bookId)
{
	$.ajax("/makeOffer",
	{
		data:
		{
			book_id: bookId
		},
		dataType: "json",
		success: function(json)
		{
			if (json.success == false)
				window.alert(json.message);
			else
				location.reload();
		},
		error: function(err)
		{
			window.alert("The server is down.  Try again later.");
		}
	});
}

function doMakeOffer(bookId, title, author)
{
	var dialog = $("<div><p>Do you want to acquire \"" + title + "\" by " +
		author + "?</p></div>").dialog(
	{
		height: 200,
		width: 400,
		modal: true,
		buttons:
		{
			"Make offer": function()
			{
				makeOffer(bookId);
			},
			"Cancel": function()
			{
				dialog.dialog("close");
			}
		}
	});
}

