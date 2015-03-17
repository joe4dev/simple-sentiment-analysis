var port = (process.env.VCAP_APP_PORT || 3000);
var express = require("express");
var bodyParser = require('body-parser');
var sentiment = require("sentiment");
var Twitter = require('twitter');
var nconf = require("nconf");

// Alternatively use nconf.get(KEY) to handle config
//nconf.file({ file: './credentials.json' });

var app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err.stack);
});
process.on("exit", function(code) {
    console.log("exiting with code: " + code);
});

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

app.get('/watchTwitter', function (req, res) {
    var stream;
    var testTweetCount = 0;
    var phrase = 'Obama';
    client.stream('statuses/filter', {track: phrase}, function(stream) {
      res.send("Monitoring Twitter for \'" + phrase
        + "\'...  Logging Twitter traffic.");

      stream.on('data', function (data) {
          testTweetCount++;
          // Update the console every 50 analyzed tweets
          if (testTweetCount % 50 === 0) {
              console.log("Tweet #" + testTweetCount + ":  " + data.text);
          }
      });

      stream.on('error', function(error) {
        throw error;
      });
    });
});

// ===== Full application =====
var stream;
var tweetCount = 0;
var tweetTotalSentiment = 0;
var monitoringPhrase;

app.get('/sentiment', function (req, res) {
    res.json({monitoring: (monitoringPhrase != null),
      monitoringPhrase: monitoringPhrase,
      tweetCount: tweetCount,
      tweetTotalSentiment: tweetTotalSentiment,
      sentimentImageURL: sentimentImage()});
});

// Example:
// url -X POST http://localhost:3000/sentiment --data '{"phrase":"obama"}' --header "Content-Type:application/json"
app.post('/sentiment', function (req, res) {
  try {
    if (req.body.phrase) {
      beginMonitoring(req.body.phrase);
      res.send(200);
    } else {
      res.status(400).send('Invalid request: send {"phrase": "obama"}');
    }
  } catch (exception) {
    res.status(400).send('Invalid request: send {"phrase": "obama"}');
  }
});

function resetMonitoring() {
  if (stream) {
    var tempStream = stream;
    stream = null;  // signal to event handlers to ignore end/destroy
    tempStream.destroySilent();
  }
    monitoringPhrase = "";
}

function beginMonitoring(phrase) {
    var stream;
    // cleanup if we're re-setting the monitoring
    if (monitoringPhrase) {
        resetMonitoring();
    }
    monitoringPhrase = phrase;
    tweetCount = 0;
    tweetTotalSentiment = 0;
    stream = client.stream('statuses/filter', {
        'track': monitoringPhrase
      }, function (inStream) {
        // remember the stream so we can destroy it when we create a new one.
        // if we leak streams, we end up hitting the Twitter API limit.
        stream = inStream;
        console.log("Monitoring Twitter for " + monitoringPhrase);
        stream.on('data', function (data) {
          // only evaluate the sentiment of English-language tweets
          if (data.lang === 'en') {
            sentiment(data.text, function (err, result) {
              tweetCount++;
              tweetTotalSentiment += result.score;
            });
          }
        });
        stream.on('error', function (error, code) {
          console.error("Error received from tweet stream: " + code);
          if (code === 420 || code === 429)  {
            console.error("API limit hit, are you using your own keys?");
          }
          resetMonitoring();
        });
        stream.on('end', function (response) {
          if (stream) { // if we're not in the middle of a reset already
            // Handle a disconnection
            console.error("Stream ended unexpectedly, resetting monitoring.");
            resetMonitoring();
          }
        });
        stream.on('destroy', function (response) {
          // Handle a 'silent' disconnection from Twitter, no end/error event fired
          console.error("Stream destroyed unexpectedly, resetting monitoring.");
          resetMonitoring();
        });
      });
    return stream;
}

function sentimentImage() {
    var avg = tweetTotalSentiment / tweetCount;
    if (avg > 0.5) { // happy
        return "/images/excited.png";
    }
    if (avg < -0.5) { // angry
        return "/images/angry.png";
    }
    // neutral
    return "/images/content.png";
}

var DEFAULT_TOPIC = "obama";
app.get('/',
    function (req, res) {
        var welcomeResponse = "<HEAD>" +
            "<title>Twitter Sentiment Analysis</title>\n" +
            "</HEAD>\n" +
            "<BODY>\n" +
            "<P>\n" +
            "Welcome to the Twitter Sentiment Analysis app.<br>\n" +
            "What would you like to monitor?\n" +
            "</P>\n" +
            "<FORM action=\"/monitor\" method=\"get\">\n" +
            "<P>\n" +
            "<INPUT type=\"text\" name=\"phrase\" value=\"" + DEFAULT_TOPIC + "\"><br><br>\n" +
            "<INPUT type=\"submit\" value=\"Go\">\n" +
            "</P>\n" + "</FORM>\n" + "</BODY>";
        if (!monitoringPhrase) {
            res.send(welcomeResponse);
        } else {
            var monitoringResponse = "<HEAD>" +
                "<META http-equiv=\"refresh\" content=\"5; URL=http://" +
                req.headers.host +
                "/\">\n" +
                "<title>Twitter Sentiment Analysis</title>\n" +
                "</HEAD>\n" +
                "<BODY>\n" +
                "<P>\n" +
                "The Twittersphere is feeling<br>\n" +
                "<IMG align=\"middle\" src=\"" + sentimentImage() + "\"/><br>\n" +
                "about " + monitoringPhrase + ".<br><br>" +
                "Analyzed " + tweetCount + " tweets...<br>" +
                "</P>\n" +
                "<A href=\"/reset\">Monitor another phrase</A>\n" +
                "</BODY>";
            res.send(monitoringResponse);
        }
    });

app.get('/monitor', function (req, res) {
    beginMonitoring(req.query.phrase);
    res.redirect(302, '/');
});

app.get('/reset', function (req, res) {
    resetMonitoring();
    res.redirect(302, '/');
});

app.listen(port);
console.log("Server listening on port " + port);
