function removeOffer(bookId)
{
	$.ajax("removeOffer",
	{
		data:
		{
			book_id: bookId
		},
		dataType: "json",
		success: function(json)
		{
			if (json.success == false)
				window.alert("Could not update database. Try again later. (1)");
			else
				location.reload();
		},
		error: function()
		{
			window.alert("Could not update database. Try again later. (2)");
		}
	});
}

function doRemoveOffer(bookId, title, author)
{
	var dialog = $("<div><p>Do you want to remove from offer \"" + title +
		"\" by " + author + "?</p></div>").dialog(
	{
		height: 200,
		width: 400,
		modal: true,
		buttons:
		{
			"Remove offer": function()
			{
				removeOffer(bookId);
			},
			"Cancel": function()
			{
				dialog.dialog("close");
			}
		}
	});
}
