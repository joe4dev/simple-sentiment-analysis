# Simple Sentiment Analysis

![Ambivalent Smiley](public/images/content.png "Ambivalent Smiley")

Sample application demonstrating how to build a sentiment analysis app usind Node.js and a couple modules.  
The application takes a keyword or hashtag, connects to Twitter to get a stream of matching tweets, 
and runs those tweets through a sentiment-analysis module to produce a sentiment score.

You can play with an instance of the application running at [http://simplesentimentanalysisforpulse.mybluemix.net/](http://simplesentimentanalysisforpulse.mybluemix.net)


## Configure

Provide the Twitter credentials via the following environment variables:

* TWITTER_CONSUMER_KEY
* TWITTER_CONSUMER_SECRET
* TWITTER_ACCESS_TOKEN_KEY
* TWITTER_ACCESS_TOKEN_SECRET

## Run
```
npm install
```

```
node app.js
```

## Tutorial

This app is based on the following tutorial: 

* Title: Build a sentiment analysis application with Node.js, Express, sentiment, and ntwitter
* Link: http://www.ibm.com/developerworks/library/wa-nodejs-app/
* Demo: http://simplesentimentanalysis.mybluemix.net/
* Source code: https://hub.jazz.net/project/1167/bluemixsentimentanalysis/overview
* Git repo: https://hub.jazz.net/git/spirit/Sentiment.Analysis.App

### Comments
* The final app doesn't work with just the snippets from the online tutorial => Some code is missing!
