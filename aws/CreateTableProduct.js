var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://dynamodb.us-west-2.amazonaws.com",
    accessKeyId: "AKIAJGHIVVTHPOTIF3YQ",
    secretAccessKey: "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"
});
// AWSAccessKeyId=AKIAILFC3SB4MLZMB72A
// AWSSecretKey=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


var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "PRODUCTS",
    KeySchema: [
        { AttributeName: "product_id", KeyType: "HASH"},  //Partition key
        { AttributeName: "name", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "product_id", AttributeType: "S" },
        { AttributeName: "name", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});