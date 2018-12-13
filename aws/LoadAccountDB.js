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

var allProducts = JSON.parse(fs.readFileSync('AccountDB.json', 'utf8'));
allProducts.forEach(function(product) {
    var params = {
        TableName: "ACCOUNTS",
        Item: {
            "username": product.username,
            "password":  product.password,
            "fullname":  product.fullname,
            "sex": product.sex,
            "email": product.email,
            "phone": product.phone,
            "address": product.address,
            "type": product.type
        }
    };

    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add movie", product.fullname, ". Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log(product.fullname);
            data += product.fullname + "<br>";
        }
    });
});

