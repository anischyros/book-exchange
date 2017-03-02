function onViewOfferInfoSuccess(json)
{
	var dialog = $("<div><p>Offer accepted by:</p><br />" +
		"<p>" + json.name + "</p><p>" + json.location + "</p>" +
		"<p>" + json.email + "</p></div>").dialog(
	{
		height: 300,
		width: 350,
		modal: true,
		buttons:
		{
			"Ok": function() { dialog.dialog("close"); }
		}
	});
}

function doViewOfferInfo(bookId)
{
	$.ajax("/getAcceptanceInfo",
	{
		data:
		{
			book_id: bookId
		},
		dataType: "json",
		success: onViewOfferInfoSuccess
	});
}

