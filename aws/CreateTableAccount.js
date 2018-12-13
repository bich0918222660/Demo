var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://dynamodb.us-west-2.amazonaws.com",
    accessKeyId: "AKIAJGHIVVTHPOTIF3YQ",
    secretAccessKey: "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"
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : "ACCOUNTS",
    KeySchema: [
        { AttributeName: "username", KeyType: "HASH"},  //Partition key
        { AttributeName: "password", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "username", AttributeType: "S" },
        { AttributeName: "password", AttributeType: "S" }
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