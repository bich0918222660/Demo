var AWS = require('aws-sdk');
var fs =  require('fs');

var s3 = new AWS.S3({
    accessKeyId: "AKIAJGHIVVTHPOTIF3YQ"
    , secretAccessKey: "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"
    , region: "us-west-2",
    endpoint: "s3.us-west-2.amazonaws.com"
});

var bucketParams = {
    Bucket : "bich021959"
};

// Call S3 to create the bucket
s3.createBucket(bucketParams, function(err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Success", data.Location);
    }
});