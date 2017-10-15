

$("#note-submit").on("click", function() {

    event.preventDefault();

    console.log("clicked");
  
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("article-id");
  

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/save/note/" + thisId,
    data: {
      // Value taken from note textarea
      body: $("#note-body").val()
    }
  })
    // With that done
    .done(function(data) {
      console.log(data);
    });

  
  $("#note-body").val("");
});




$("#scrape-button").on("click", function(){
  console.log("Scrape button clicked.");

  $.ajax({
    method: "GET",
    url: "/scrape",
  }).done(function(data){
    return redirect("/")
  })

})

