const express= require("express");
const bodyParser= require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');

const app= express();


app.set("view engine", "ejs");

//Must initalize body parser to use app.post below
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//mongoose DB setup

//create database in mongodb
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb+srv://admin-mar:test123@cluster0-kbvw8.mongodb.net/todolistDB", {useNewUrlParser: true});

//1st step is to create mongoose schema

var Schema = mongoose.Schema;
const itemsSchema = new Schema ({
  name: String
});

//2nd step- create mongoose model
const Item = mongoose.model("Item", itemsSchema); //make sure "Item" is singular


//3rd create documents

const item1 = new Item ({
  name: "Welcome to the Galactic Todolist!"
});
const item2 = new Item ({
  name: "Type your list item below"
});
const item3 = new Item ({
  name: "Add list item with the + button"
});

//create an array
const defaultItems= [item1, item2, item3];

//4th step - Use insertmany to send many items
//for loop below ensures it is only created
//once in the beginning

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


//Deleting All Items
// Item.deleteMany({}, function(err){
//
// })

//5th step- find and call items. must use the follow:
//using the .find method below.

//6th step- passover found items to server
app.get("/", function(req, res) {

  Item.find({}, function (err, foundItems){
    if (foundItems.length === 0) {

    Item.insertMany(defaultItems, function(err){
      if (err) {
        console.log(err);
      }
      else {
        console.log("Sucessful Insert!")
      }
    });
    res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/")
      }
      else {
      //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  }
})

});

//storing inserted items into DB
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save()
      res.redirect("/" + listName)
    }
  )
  }

   //redirects to the homeroute immediately
});

//Creating a delete item function from DB
app.post("/delete", function(req,res){
  const checkedItemId = req.body.check;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({_id: checkedItemId}, function(err){
      if (err) {
        console.log(err);
      }
      else {
        console.log("successful Delete")
      }
    });
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName)
      }
    })
  }

});






app.get("/about", function(req, res){
  res.render("about");
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
  console.log("Server has started successfully");
});
