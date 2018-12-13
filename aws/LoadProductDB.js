var AWS = require("aws-sdk");
var fs = require('fs');

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://dynamodb.us-west-2.amazonaws.com",
    accessKeyId: "AKIAJGHIVVTHPOTIF3YQ",
    secretAccessKey: "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"
});

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Importing movies into DynamoDB. Please wait.");

var data = "Products";

var allProducts = JSON.parse(fs.readFileSync('ProductDB.json', 'utf8'));
allProducts.forEach(function(product) {
    var params = {
        TableName: "PRODUCTS",
        Item: {
            "product_id": product.id,
            "name":  product.name,
            "price":  product.unitprice ,
            "discount":  product.discount ,
            "quantity":  product.quantity ,
            "description":  product.description ,
            "category":  product.category ,
            "status":  product.status ,
            "image":  product.image
        }
    };

    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add movie", product.name, ". Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log(product.name);
            data += product.name + "<br>";
        }
    });
});

