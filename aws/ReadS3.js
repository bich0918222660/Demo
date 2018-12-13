var AWS = require('aws-sdk');
var fs =  require('fs');
var http = require('http');

var s3 = new AWS.S3({
    accessKeyId: "AKIAIEDNTQFIAAFGF4HQ"
    , secretAccessKey: "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"
    , region: "us-west-2",
    endpoint: "s3.us-west-2.amazonaws.com"
});

var myBucket = 'bich1959';

var myKey = '16f005840fce52bc9a58f61597931565';

http.createServer(function (req, res) {

    params = {Bucket: myBucket, Key: myKey};

    s3.getObject(params, function (err, data) {

        if (err) {

            console.log(err)

        } else {

            var vals = (new Buffer(data.Body)).toString('base64');

            console.log(vals);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write("<img src='data:image/jpg;base64," + vals + "'/>");
            res.end();

        }

    });

}).listen(8000);