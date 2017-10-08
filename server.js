//mongodb://heroku_c538m350:tn8jl8ccop04mhdd14e9j1himj@ds113825.mlab.com:13825/heroku_c538m350

//dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

//models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

//scraping helpers
var request = require("request");
var cheerio = require("cheerio");

//ES6 promise for mongoose
mongoose.Promise = Promise;

// Initialize Express
var app = express();

// body parser
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

//handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/slatescraper", {useMongoClient: true});
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


//ROUTES
app.get("/", function(req, res){
  Article.find({}, function(error, found){
    if (error) {
      console.log(error)
    } else {
      var hbsObj = {articles: found}
      res.render("index", hbsObj);
    }
  });
});

app.get("/saved", function(req, res){
  Article.find({saved: true}, function(error, found){
    if (error){
      console.log(error);
    } else {
      var hbsObj = {articles: found}
      res.render("saved", hbsObj);
    }
  });
})

app.get("/scrape", function(req, res) {
  
  request("http://www.slate.com/full_slate.html", function(error, response, html) {
    
    var $ = cheerio.load(html);
    
    $("div.tile").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("div.full-tile").children("span.hed").text();
      result.link = $(this).children("a").attr("href");

      console.log(result);

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)


      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });
  });
  
  res.send("Scrape Complete");
});



app.listen(3000, function() {
  console.log("App running on port 3000!");
});
