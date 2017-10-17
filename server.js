//mongodb://heroku_c538m350:tn8jl8ccop04mhdd14e9j1himj@ds113825.mlab.com:13825/heroku_c538m350

//dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require('method-override');

//models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");


//scraping helpers
var request = require("request");
var cheerio = require("cheerio");

//ES6 promise for mongoose
mongoose.Promise = Promise;

var port = process.env.PORT || 3000;

// Initialize Express
var app = express();

// body parser
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));


//method override
app.use(methodOverride("_method"));

//handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Database configuration with mongoose
mongoose.connect("mongodb://heroku_c538m350:tn8jl8ccop04mhdd14e9j1himj@ds113825.mlab.com:13825/heroku_c538m350");
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
  Article.find({}).sort({ date: 1}).exec(function(error, found){
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

app.get("/articles/:id", function(req, res) {

  
  Article.findOne({ "_id": req.params.id })
  
  .populate("note")
  
  .exec(function(error, doc) {
    
    if (error) {
      console.log(error);
    }
    
    else {
      console.log(doc);
      res.render("notes", doc);
    }
  });
});

app.get("/scrape", function(req, res) {
  
  request("http://www.slate.com/full_slate.html", function(error, response, html) {

    console.log("Making scrape request");
    
    var $ = cheerio.load(html);
    
    $("div.tile").each(function(i, element) {

      // Save an empty result object
      var result = {};

      result.saved = false;

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("div.full-tile").children("span.hed").text();
      result.link = $(this).children("a").attr("href");


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
  
  res.redirect("/");
});

app.post("/save/:id", function(req, res){


  if (req.body.saved === "true"){
    
    Article.findOneAndUpdate({"_id": req.params.id}, {"saved": true}, function(error, doc) {
      // Log any errors
      if (error) {
        console.log(error);
      }
      // Or send the doc to the browser as a json object
      else {
        res.redirect("/saved");
      }
    });
  
  } else if (req.body.saved === "false") {
    
    Article.findOneAndUpdate({"_id": req.params.id}, {"saved": false}, function(error, doc) {
      // Log any errors
      if (error) {
        console.log(error);
      }
      // Or send the doc to the browser as a json object
      else {
        res.redirect("/saved");
      }
    });
  }
  
})

app.post("/save/note/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});



app.listen(port, function() {
  console.log("App running.");
});
