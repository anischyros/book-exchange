function onAddNewBookSuccess(data)
{
	if (data.success === false)
	{
		window.alert(data.message);
	}
	else
	{
		var dialog = 
			$("<div class='text-center'><p>Book added to database.</p></div>")
			.dialog(
		{
			height: 150,
			width: 350,
			modal: true,
			buttons:
			{
				"Ok": function() 
				{
					dialog.dialog("close"); 
					location.reload();
				}
			}
		});
	}
}

function addNewBook()
{
	var author = $("#author-field").val().trim();
	var title = $("#title-field").val().trim();
	var isbn = $("#isbn-field").val().trim();

	$.ajax("/addNewBook",
	{
		data:
		{
			author: author,
			title: title,
			isbn: isbn
		},
		success: onAddNewBookSuccess,
		error: function() 
		{ 
			window.alert("addNewBook webservice bombed."); 
		}
	});
}

function doAddNewBook()
{
	$("#author-field").val("");
	$("#title-field").val("");
	$("#isbn-field").val("");
	var dialog = $("#add-new-book").dialog(
	{
		height: 400,
		width: 350,
		modal: true,
		buttons:
		{
			"Add new book": function()
			{
				dialog.dialog("close");
				addNewBook();
			},
			"Cancel": function() { dialog.dialog("close"); }
		}
	});
}

function deleteBook(bookId)
{
	$.ajax("/deleteBook",
	{
		data:
		{
			id: bookId
		},
		dataType: "json"
	});
}

function tradeThisBook(bookId)
{
	$.ajax("/tradeBook",
	{
		data:
		{
			id: bookId
		},
		dataType: "json",
		success: function(data)
		{
			if (data.success == false)
				window.alert(data.message);
			else
				window.alert("Book has now been offered for trade.");
		},
		error: function(err)
		{
			window.alert(err);
		}
	});
}

function doSetItemDisposition(bookId, title, author)
{
	var dialog = $("<div><p>What disposition do you want to give \"" + title + 
		"\" by " + author + "?</p></div>").dialog(
	{
		height: 200,
		width: 400,
		modal: true,
		buttons:
		{
			"Delete this book": function() 
			{ 
				deleteBook(bookId);
				location.reload();
			},
			"Trade this book": function() 
			{ 
				tradeThisBook(bookId); 
				dialog.dialog("close");
			},
			"Cancel": function() { dialog.dialog("close"); }
		}
	});
}
