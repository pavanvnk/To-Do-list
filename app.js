require('dotenv').config();
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require('mongoose')
var _ = require('lodash')
const date = require(__dirname + "/date.js")

const app = express()

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"))

mongoose.connect(process.env.MONGOOSE_KEY)

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model('Item', itemsSchema)

const item1 = new Item({
  name: "Welcome to todolist!"
})

const item2 = new Item({
  name: "Click on + button to add a new item."
})

const item3 = new Item({
  name: "<--Hit this to delete an item."
})

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List', listSchema)

app.get("/", (req, res) => {

  Item.find(function(err, items) {

    if(items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Succesfully saved default items.");
        }

        res.redirect("/")
      })
    } else {
        const day = date.getDate()
        res.render('list', {listTitle: day, newListItems: items})
      }
    })
})

app.get("/:listName", (req, res) => {
  const requestedList = _.capitalize(req.params.listName)

  List.findOne({name: requestedList}, function(err, docs) {
    if(err || !docs) {
      const list = new List({
        name: requestedList,
        items: defaultItems
      })
    
      list.save();
      res.redirect("/" + requestedList)
    } else {
      res.render('list', {listTitle: docs.name, newListItems: docs.items})
    }
  })
})

app.post("/", (req, res) => {

  const itemName = req.body.newItem
  const listName = req.body.list
  
  const item = new Item({
    name: itemName
  })

  const day = date.getDate()

  if(listName === day.split(" ")[0]) {
    item.save()
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, docs) {
      if(err) {
        console.log(err);
      } else {
        docs.items.push(item)
        docs.save()
        res.redirect("/" + listName)
      }
    })
  }
})

app.post("/delete", (req, res) => {
  const checkedItemID = req.body.checkbox
  const listName = req.body.listName

  const day = date.getDate()
  
  if(listName === day) {
    Item.deleteOne({ _id: checkedItemID}, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("Succesfully deleted the checked item.");
      }
    })
    res.redirect("/")
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err) {
      if(!err) {
        res.redirect("/" + listName)
      }
    })
  }  
})

app.listen(3000, () => console.log("Server started on port 3000."))