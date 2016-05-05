var MongoClient = require('mongodb').MongoClient,
    settings = require('./config.js'),
    Converter = require("csvtojson").Converter,
    httpRequest = require('request');

var fullMongoUrl = settings.mongoConfig.serverUrl + settings.mongoConfig.database;
var exports = module.exports = {};

// Create "tickers" collection if it does not already exist
MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        db.createCollection("historicalData");
    });

// Exported mongo functions
MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        var tickerCollection = db.collection("historicalData");

        exports.checkDates = function(symbol,start,end) {
            // Try to find ticker in the database
            //symbol = "AAPL";
            //start = 10201;
            return tickerCollection.find({Symbol: symbol}).sort({Date: -1}).toArray().then(function(ticker) {
              //console.log(ticker);
                if (ticker.length) {
                  var lastDate = ticker[0].Date;
                  return lastDate;
                } else {
                    return null;
                }
            });
        };
        exports.addTicker = function(symbol, data){
          //var parseDate = d3.time.format("%Y-%m-%d").parse;
          // data.forEach(function(day) {
          //   console.log(day.Date);
          //   //tickerCollection.update({symbol: symbol}, {$set: {symbol: symbol, date: day.Date, price: day.Open}}, {upsert: true});
          // });
          // data.forEach(function(day) {
          //   day.Date = new Date(day.Date).toISOString().split('T')[0];;
          // });
          return tickerCollection.insertMany(data).then(function() {
              return tickerCollection.find().toArray();
          });
        };

        exports.getData = function(symbol, start, end){
          // data.forEach(function(day) {
          //   console.log(day.Date);
          //   //tickerCollection.update({symbol: symbol}, {$set: {symbol: symbol, date: day.Date, price: day.Open}}, {upsert: true});
          // });
          return tickerCollection.find({Symbol: symbol, Date: {$gte: start, $lte: end}}).toArray().then(function(data){
            return data;
          });

        };

      };
    });
