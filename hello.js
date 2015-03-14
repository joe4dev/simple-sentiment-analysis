var port = (process.env.VCAP_APP_PORT || 3000);
var express = require("express");

var app = express();

app.get('/hello', function(req, res) {
    res.send("Hello world.");
});

app.listen(port);
console.log("Server listening on port " + port);