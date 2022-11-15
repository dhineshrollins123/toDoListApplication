const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/dkdate.js");
const mongoose = require("mongoose");
const _ = require('lodash');

const app = express();

let port = process.env.PORT;

if(port == null || port == ""){
	port = 3000;
}

app.listen(port, () => {
	console.log("APPLICATION IS RUNNING SUCCESSFULLY...");
});

// mongoose.connect("mongodb://localhost:27017/todoListDb");
mongoose.connect("mongodb+srv://dhinesh:dktest123@cluster0.ypmtw4w.mongodb.net/todoListDb");

console.log("Database Connected Successfully !");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const itemSchema = mongoose.Schema({
	name: String,
});

const Item = mongoose.model("Item", itemSchema);

const customListSchema = {
	name: String,
	list: [itemSchema]
};

const List = mongoose.model("List", customListSchema);

const item1 = new Item({
	name: "Welcome to your ToDo List",
});

const item2 = new Item({
	name: "Hit the + button to add a item !",
});

const item3 = new Item({
	name: "<-- Hit this to remove item>",
});

const defaultItems = [item1, item2, item3];

app.get("/", (req, res) => {
	Item.find({}, function (err, items) {
		if (items.length === 0) {
			Item.insertMany(defaultItems, function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("Default records inserted !");
				}
			});
			res.redirect("/");
		} else {
			res.render("list", { listTitle: "Today", newTask: items });
		}
	});
});

app.post("/", (req, res) => {
	var task = req.body.item;
	var listName = req.body.list;

	const item = new Item({
		name: task,
	});

	if (listName === "Today") {
		item.save();
		res.redirect("/");
	}else{
		List.findOne({name: listName},function(err,results){
			if(!err){
				if(results){
					results.list.push(item);
					results.save();
					res.redirect("/"+listName);
				}
			}
		});
	}
});

app.post("/delete", function (req, res) {
	const checkedId = req.body.isChecked.trim();
	const listName = req.body.listName;


	if(listName === "Today"){
		Item.findByIdAndDelete(checkedId, function (err, docs) {
			if (err) {
				console.log(err);
			} else {
				console.log(checkedId + " Record successfully deleted !" + docs);
				res.redirect("/");
			}
		});
	}else{
		List.findOneAndUpdate({name: listName},{$pull: {list: {_id: checkedId}}},function(err,foundList){
			if(!err){
				res.redirect("/"+listName);
			}
		});
	}

	
});



app.get("/:customType", function (req, res) {
	const customListName = _.capitalize(req.params.customType);

	List.findOne({ name: customListName }, function (err, results) {
		if (!err) {
			if (results) {
				console.log("list exist !");
				res.render("list", { listTitle: results.name, newTask: results.list });
			} else {
				console.log("list not exist !");
				const list = new List({
					name: customListName,
					list: defaultItems,
				});

				list.save();
				res.redirect("/" + customListName);
			}
		}
	});
});

app.get("/about", function (req, res) {
	res.render("about");
});
