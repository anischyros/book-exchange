var express = require("express");
var http = require("http");
var app = express();
var server = http.Server(app);
var fs = require("fs");
var cookieParser = require("cookie-parser");
var cookieSession = require("cookie-session");
var ejs = require("ejs");
var mongo = require("mongodb");
var ObjectId = mongo.ObjectId;
var mongoClient = mongo.MongoClient;

// Set up cookies
app.use(cookieParser("$0ph13"));
app.use(cookieSession({
    name: "session",
    keys: ["$0ph13k177y"],
    maxAge: 24 * 60 * 60 * 1000
}));

var db, usersColl, booksColl, offersColl;

mongoClient.connect("mongodb://localhost/book-exchange", 
	function(err, connection)
{
    db = connection;

    initalizeCollectionVariables(db);

	app.get("/", doViewAllBooks);
	app.get("/ViewAllBooks", doViewAllBooks);
	app.get("/ViewMyBooks", doViewMyBooks);
	app.get("/ViewMyTradeOffers", doViewMyTradeOffers);
	app.get("/ViewOtherTradeOffers", doViewOtherTradeOffers);
	app.get("/ViewMyAcceptedOffers", doViewMyAcceptedOffers);
	app.get("/login", doLogin);
	app.get("/logout", doLogout);
	app.get("/createNewLogin", doCreateNewLogin);
	app.get("/addNewBook", doAddNewBook);
	app.get("/getBookCover", doGetBookCover);
	app.get("/deleteBook", doDeleteBook);
	app.get("/tradeBook", doTradeBook);
	app.get("/removeOffer", doRemoveOffer);
	app.get("/makeOffer", doMakeOffer);
	app.get("/getAcceptanceInfo", doGetAcceptanceInfo);

	app.get("/login.js", function(request, response)
	{
		fs.createReadStream("client/login.js", "utf-8").pipe(response);
	});
	app.get("/addNewBook.js", function(request, response)
	{
		fs.createReadStream("client/addNewBook.js", "utf-8").pipe(response);
	});
	app.get("/myOffers.js", function(request, response)
	{
		fs.createReadStream("client/myOffers.js", "utf-8").pipe(response);
	});
	app.get("/myAcceptedOffers.js", function(request, response)
	{
		fs.createReadStream("client/myAcceptedOffers.js", "utf-8")
			.pipe(response);
	});
	app.get("/otherOffers.js", function(request, response)
	{
		fs.createReadStream("client/otherOffers.js", "utf-8").pipe(response);
	});

	server.listen(8080);
	console.log("Listening to port 8080");
});

function initalizeCollectionVariables(db)
{
	db.collection("users", function(err, collection)
	{
		usersColl = collection;
		db.collection("books", function(err, collection)
		{
			booksColl = collection;
			db.collection("offers", function(err, collection)
			{
				offersColl = collection;
			});
		});
	});
}

function doViewAllBooks(request, response)
{
	booksColl.find(function(err, data)
	{
		var books = [];
		data.each(function(err, book)
		{
			if (book)
			{
				books.push(book);
			}
			else
			{
				// Generate and send main page
				var template = 
					fs.readFileSync("./ejs/ViewAllBooks.ejs", "utf-8");
				response.end(ejs.render(template,
				{
					loggedIn: request.session.loggedIn,
					login: request.session.login,
					books: books
				}));
			}
		});
	});
}

function doViewMyBooks(request, response)
{
	booksColl.find({ owner: request.session.login }, function(err, data)
	{
		var books = [];
		data.each(function(err, book)
		{
			if (book)
			{
				books.push(book);
			}
			else
			{
				// Generate and send ViewMyBooks page 
				var template = 
					fs.readFileSync("./ejs/ViewMyBooks.ejs", "utf-8");
				response.end(ejs.render(template,
				{
					loggedIn: request.session.loggedIn,
					login: request.session.login,
					books: books
				}));
			}
		});
	});
}

function doLogin(request, response)
{
    response.setHeader("Content-Type", "text/json");
    usersColl.findOne({ login: request.query.login }, function(err, item)
    {
        var out;
        if (!item || item.password != request.query.password)
        {
            out = { success: false };
        }
        else
        {
            out = { success: true };

            // Indicate that we're now logged in
            request.session.loggedIn = true;
            request.session.login = request.query.login;
        }
        response.end(JSON.stringify(out));
    });
}

function redirectToMainPage(response)
{
    // Resend main page through redirect
    response.setHeader("Location", "/");
    response.writeHead(302);
    response.end();
}

function doLogout(request, response)
{
    // Clear session
    delete request.session.loggedIn;
    delete request.session.login;

    redirectToMainPage(response);
}

function doCreateNewLogin(request, response)
{
    response.setHeader("Content-Type", "text/json");

    usersColl.count({ login: request.query.login }, function(err, count)
    {
        var out;
        if (count == 1)
        {
            out = { success: false };
        }
        else
        {
            var obj =
            {
                login: request.query.login,
				name: request.query.name,
				location: request.query.location,
				email: request.query.email,
                password: request.query.password
            };
            usersColl.save(obj);
            out = { success: true };

            // Indicate that we're now logged in
            request.session.loggedIn = true;
            request.session.login = request.query.login;
        }
        response.end(JSON.stringify(out));
    });
}

function doAddNewBook(request, response)
{
	var author = request.query.author;
	var title = request.query.title;
	var isbn = request.query.isbn;

	if (!isbn)
	{
		response.setHeader("Content-Type", "text/json");
		response.end(JSON.stringify(
		{ 
			success: false,
			message: "This system does not support books without an ISBN."
		}));
		return;
	}

	var options =
	{
		method: "GET",
		host: "www.librarything.com",
		path: "/devkey/KEY/medium/isbn/" + isbn
	};

	var callback = function(r)
	{
		var cover = new Buffer(Number(r.headers["content-length"]), 0, 
			"binary");
		var len = 0;
		r.on("data", function(chunk) 
		{
			chunk.copy(cover, len, 0, chunk.length);	
			len += chunk.length;
		});
		r.on("end", function()
		{
			var obj =
			{
				author: author,
				title: title,
				isbn: isbn,
				contentType: r.headers["content-type"],
				cover: cover,
				owner: request.session.login
			};
			booksColl.save(obj, function(err, data)
			{
				response.setHeader("Content-Type", "text/json");
				if (err)
				{
					response.end(JSON.stringify(
					{ 
						success: false, 
						message: 
							"Could not add book to database.  Try again later."
					}));
				}
				else
					response.end(JSON.stringify({ success: true }));
			});
		});

	};

	http.request(options, callback).end();
}

function doGetBookCover(request, response)
{
	var id = request.query.id;

	booksColl.findOne({ _id: new ObjectId(id) }, function(err, data)
	{
		if (!data)
		{
			response.writeHead(404);
			response.end("Image cannot be found.");
			return;
		}

		response.writeHead(200, { "Content-Type": data.contentType });
		response.end(data.cover.buffer, "binary");
	});
}

function doDeleteBook(request, response)
{
	var id = request.query.id;

	booksColl.remove({ _id: ObjectId(id) }, function(err)
	{
		response.setHeader("Content-Type", "text/json");
		if (err)
			response.end(JSON.stringify({ success: false }));
		else
			response.end(JSON.stringify({ success: true }));
	});
}

function doTradeBook(request, response)
{
	var bookId = request.query.id;

	offersColl.findOne({ book_id: bookId }, function(err, data)
	{
		response.setHeader("Content-Type", "text/json");
		if (data != null)
		{
			response.end(JSON.stringify(
			{ 
				success: false,
				message: "Book has already been offerred for trade."
			}));
			return;
		}

		offersColl.save(
		{
			book_id: bookId,
			offered_by: request.session.login
		}, 
		function()
		{
			response.end(JSON.stringify({ success: true }));
		});
	});
}

function doViewMyTradeOffers(request, response)
{
	offersColl.find({ "offered_by": request.session.login }, 
		function(err, offers)
	{
		var offerList = [];
		offers.each(function(err, offer)
		{
			if (offer)
				offerList.push({ _id: ObjectId(offer.book_id) });
			else
			{
				booksColl.find({ $or: offerList }, function(err, books)
				{
					var booksList = [];
					books.each(function(err, book)
					{
						if (book)
							booksList.push(book);
						else
						{
                			var template = fs.readFileSync(
								"./ejs/ViewMyOffers.ejs", "utf-8");
							response.end(ejs.render(template,
							{
								loggedIn: request.session.loggedIn,
								login: request.session.login,
								books: booksList
			                }));
						}
					});
				});
			}
		});
	});
}

function doRemoveOffer(request, response)
{
	offersColl.remove({ book_id: request.query.book_id }, function(err)
	{
		response.setHeader("Content-Type", "text/json");
		if (err)
			response.end(JSON.stringify({ success: false }));
		else
			response.end(JSON.stringify({ success: true }));
	});
}

function doViewOtherTradeOffers(request, response)
{
	offersColl.find(function(err, offers)
	{
		var offerList = [];
		offers.each(function(err, offer)
		{
			if (offer)
			{
				if (offer.offered_by != request.session.login)
					offerList.push({ _id: ObjectId(offer.book_id) });
			}
			else
			{
				booksColl.find({ $or: offerList }, function(err, books)
				{
					var booksList = [];
					books.each(function(err, book)
					{
						if (book)
							booksList.push(book);
						else
						{
                			var template = fs.readFileSync(
								"./ejs/ViewOtherOffers.ejs", "utf-8");
							response.end(ejs.render(template,
							{
								loggedIn: request.session.loggedIn,
								login: request.session.login,
								books: booksList
			                }));
						}
					});
				});
			}
		});
	});
}

function doViewMyAcceptedOffers(request, response)
{
	offersColl.find(function(err, offers)
	{
		var offerList = [];
		offers.each(function(err, offer)
		{
			if (offer)
			{
				if (offer.accepted_by && offer.offered_by == request.session.login)
					offerList.push({ _id: ObjectId(offer.book_id) });
			}
			else
			{
				booksColl.find({ $or: offerList }, function(err, books)
				{
					var booksList = [];
					books.each(function(err, book)
					{
						if (book)
							booksList.push(book);
						else
						{
                            var template = fs.readFileSync(
                                "./ejs/ViewMyAcceptedOffers.ejs", "utf-8");
                            response.end(ejs.render(template,
                            {
                                loggedIn: request.session.loggedIn,
                                login: request.session.login,
                                books: booksList
                            }));
						}
					});
				});
			}
		});
	});
}

function doMakeOffer(request, response)
{
	offersColl.findOne({ book_id: request.query.book_id }, function(err, offer)
	{
		response.setHeader("Content-Type", "text/json");
		if (err || !offer)
		{
			response.end(JSON.stringify(
			{
				success: false,
				message: "Could not update database.  Try again later."
			}));
			return;
		}

		if (offer.accepted_by)
		{
			var obj = { success: false };
			if (offer.accepted_by == request.session.login)
				obj.message = "You already have dibs on this book.";
			else
				obj.message = "Someone already has dibs on this book.";
			response.end(JSON.stringify(obj));
			return;
		}
		
		offer.accepted_by = request.session.login;
		offersColl.save(offer, function(err)
		{
			response.end(JSON.stringify({ success: true }));
		});
	});
}

function doGetAcceptanceInfo(request, response)
{
	response.setHeader("Content-Type", "text/json");
	offersColl.findOne({ book_id: request.query.book_id }, function(err, offer)
	{
		usersColl.findOne({ login: offer.accepted_by }, function(err, user)
		{
			response.end(JSON.stringify(user));
		});
	});
}

