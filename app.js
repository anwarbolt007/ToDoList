//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://anwarbolt007:<password>@todolist.bik7nwl.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
});

//Schema for out item list - contains only taskname
const itemsSchema = mongoose.Schema({
  name: {
    type: String,
    required: [1, "Task not specified!"]
  }
});

//Create the model
const Item = mongoose.model("Item", itemsSchema);

//List Schema
const listSchema = mongoose.Schema({
  name: {
    type: String,
    required: [1, "Cannot have a list without a Name!"]
  },
  items : [itemsSchema]
});

//List Model
const List = mongoose.model("List", listSchema);

//Set of Default Items in Item List
const item1 = new Item({
  name: "Welcome to the todoList!"
});

const item2 = new Item({
  name: "Hit the + button to add an item."
});

const item3 = new Item({
  name: "<---  Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const currDate = date.getDate();
app.get("/", function(req, res) {
  Item.find(function(err, items){
    if(err){
      console.log(err);
    }else{
      if(items.length === 0){
        Item.insertMany(defaultItems, function(err){
          if(err)
            console.log(err);
          else
            console.log("Default Items successfully inserted.");
        });
        res.redirect("/");
      }else
        res.render("list", {listTitle: currDate, newListItems: items});
    }
  });
});

app.post("/", function(req, res){
  const customListName = req.body.list;
  const itemName = req.body.newItem;
  if(itemName){
    const item = new Item({
      name: itemName
    });

    if(customListName === currDate){
      item.save().then(function(){res.redirect("/");});
    }else{
      const item = new Item({
        name: itemName
      });
      List.findOne({name: customListName}, function(err, foundList){
        if(err){
          console.log(err);
        }else{
          foundList.items.push(item);
          foundList.save().then(function(){res.redirect("/"+customListName);});
        }
      });
    }
  }else{
    if(customListName === currDate) res.redirect("/");
    else res.redirect("/" + customListName);
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === currDate){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err)
        console.log("Item Deletion Failed");
        else
        console.log("Item #" + checkedItemId + " successfully deleted!");
      });
      res.redirect("/");
  }else{
    List.findOneAndUpdate(
      //Delete the selected item from embedded itemsList inside the specified customList
      {name: listName},
      {$pull : {items: {_id: checkedItemId}}},
      function(err){
        if(err)
          console.log(err);
        else
          console.log("Item #" + checkedItemId + " successfully deleted from list " + listName);
      }
    );
    res.redirect("/" + listName);
  }
});


app.get("/:customList", function(req, res){
  const customListName = _.capitalize(req.params.customList);
  List.findOne({name: customListName}, function(err, foundList){
    if(err)
      console.log(err);
    else{
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save().then(function(){res.redirect("/"+customListName)});
      }else{
        //Show an existing list
        res.render("list", {listTitle: customListName, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});


//Heroku custom port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully!");
});
