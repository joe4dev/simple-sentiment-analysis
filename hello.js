var port = (process.env.VCAP_APP_PORT || 3000);
var express = require("express");
var sentiment = require("sentiment");
var Twitter = require('twitter');
var nconf = require("nconf");

// Alternatively use nconf.get(KEY) to handle config
//nconf.file({ file: './credentials.json' });

var app = express();

if (app.get('env') == 'development') {
  app.use(express.errorHandler());
}

app.get('/hello', function(req, res) {
    res.send("Hello world.");
});

app.get('/testSentiment',
    function (req, res) {
        var response = "<HEAD>" +
          "<title>Twitter Sentiment Analysis</title>\n" +
          "</HEAD>\n" +
          "<BODY>\n" +
          "<P>\n" +
          "Welcome to the Twitter Sentiment Analysis app.  " +   
          "What phrase would you like to analzye?\n" +                
          "</P>\n" +
          "<FORM action=\"/testSentiment\" method=\"get\">\n" +
          "<P>\n" +
          "Enter a phrase to evaluate: <INPUT type=\"text\" name=\"phrase\"><BR>\n" +
          "<INPUT type=\"submit\" value=\"Send\">\n" +
          "</P>\n" +
          "</FORM>\n" +
          "</BODY>";
        var phrase = req.query.phrase;
        if (!phrase) {
            res.send(response);
        } else {
            sentiment(phrase, function (err, result) {
                response = 'sentiment(' + phrase + ') === ' + result.score;
                res.send(response);
            });
        }
    });

// Create your own app at: https://dev.twitter.com/apps
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

app.get('/twitterCheck', function (req, res) {
    tweeter.verifyCredentials(function (error, data) {
        res.send("Hello, " + data.name + ".  I am in your twitters.");
    });
});

// Alternatively use GET account/verify_credentials to verify credentials
app.get('/api_limits', function (req, res) {
  client.get('application/rate_limit_status', function(error, tweets, response){
    if(error) {
      console.log(error)
      throw error;
    }
    res.send(response);
  });
});

app.listen(port);
console.log("Server listening on port " + port);