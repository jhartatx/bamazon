var inquirer = require("inquirer");
var mysql = require("mysql");
var Table = require('cli-table');

//connect to database
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId + "\n");
  readMenu();
});

//display table from database
function readMenu() {
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;

    var table = new Table({
      head: ['Item ID', 'Product Name', 'Department Name', 'Price', 'Quantity']
  });

  for(var i = 0; i < results.length; i++){
  table.push([
      results[i].item_id, results[i].product_name, results[i].department_name, results[i].price, results[i].stock_quantity
  ]);
}

  console.log(table.toString());
  buy();
  });
};
//prompt user what they want to buy
function buy() {
  connection.query("SELECT * FROM products", function(err, results) {
      if (err) throw err;

  inquirer.prompt([
    {
    type: "rawlist",
    name: "choice",
    choices: function() {
      var choicesArray = [];
      for(var i =0; i<results.length; i++){
        choicesArray.push(results[i].product_name)
      }
      return choicesArray;
    },
    message: "What would you like to purchase?"
  },
  {
    name: "bid",
    type: "input",
    message: "How many would you like?"
  }
  ]).then(function(response){
    console.log("You want: " + response.bid + " of " + response.choice);

    var chosenItem;
    for(var i = 0; i< results.length; i++) {
      if(results[i].product_name === response.choice){
        chosenItem = results[i];
        console.log("We have " + chosenItem.stock_quantity + " of what you are looking for");
      }
    }
    if(response.bid < chosenItem.stock_quantity) {
      var amountLeft = chosenItem.stock_quantity - response.bid;
      updateDb(amountLeft, response.choice);
    }
    if(response.bid > chosenItem.stock_quantity){
      console.log("Sorry we do not have enough stock for that request, please try another product");
      readMenu();
    }
});

});
};

function updateDb(amount, item) {
  var sql = ("UPDATE products SET stock_quantity = ? WHERE product_name = ?");
  connection.query(sql, [amount, item], function (err, results){
    if(err) throw err;
    console.log(results.affectedRows + " record(s) updated");
    readMenu();
  })
};
