var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var handlebars = require("express-handlebars");
// ^ requiring our standard frameworks to utilize node.js/database and logging of actions

// requiring axois/cheerio for web scraping
var axios = require("axios");
var cheerio = require("cheerio");

// variable to require all databases
var db = require("./models");

var PORT = 3000;

// variable for express use
var app = express();

// code for logger middleware
app.use(logger("dev"));

// code which turns data into JSON object, which is more readable for computer to go through data and extract or manipulate
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public folder static
app.use(express.static("public"));

// code to link to mongoDB
mongoose.connect("mongodb://localhost/homeworkDatabase", { useNewUrlParser: true });

// Scraper routes
// GET route for scraper vice website
app.get("/scrape", function (req, res) {

    axios.get("https://www.si.com/").then(function(response) {
        // load into cheerio and save to $ for shorthand selector
        var $ = cheerio.load(response.data);
        //  grab h2 with article tag
        $("article h2").each(function (i, element) {
            // empty result object
            var result = {};

            // add text and href of every link, and save them as properties of result object
            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            // Create new article from 'result' object built from scraping
            db.Article.create(result)
                .then(function (dbArticle) {
                    // result in console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    return res.json(err);
                });
        });

        // message if scrape is complete
        res.send("Scrape Complete");
    });
});


// route to get articles from db
app.get("/articles", function (req, res) {
    // grab all documents in articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If able to find article, send back to client
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

//route to get article by id
app.get("/articles/:id", function(req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("comment")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);

        });
});

// route for saving/updating article's comment
app.post("/articles/:id", function(req, res) {
    db.Comment.create(req.body)
        .then(function(dbComment) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});






