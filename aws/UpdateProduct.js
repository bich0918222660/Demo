var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://dynamodb.us-west-2.amazonaws.com",
    accessKeyId: "AKIAIEDNTQFIAAFGF4HQ",
    secretAccessKey: "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"
});

var docClient = new AWS.DynamoDB.DocumentClient()

var TABLE_PRODUCTS = "PRODUCTS";

var id = "SP002";
var name = "Vest trắng lịch lãm";

// Update the item, unconditionally,

var params = {
    TableName: TABLE_PRODUCTS,
    Key:{
        "product_id": id,
        "name": name
    },
    UpdateExpression: "set price = :pr, quantity = :q",
    ExpressionAttributeValues:{
        ":pr": 2400,
        ":q": 24
    },
    ReturnValues:"UPDATED_NEW"
};

console.log("Updating the item...");
docClient.update(params, function(err, data) {
    if (err) {
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
});
