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

        exports.chedckData = function(ticker,start,end) {
          ticker = "AAPL";
          start = 10201;
          return tickerCollection.find({symbol: ticker, date: {$gte: start}}).sort({date: -1}).toArray().then(function(listOfTickers) {
              // Check if ticker was found
              console.log(listOfTickers);
              if (listOfTickers.length) {


              } else {

              }
          });



        };

        /*
         *  Checks if the ticker with the given symbol has been updated in the last hour.
         *  Returns false if it hasn't and true if it has.
         */
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
        // Updates the ticker with the given symbol with the given lastQueried date and query info
        exports.refreshTicker = function(symbol, lastQueried, info) {
            // replace all null fields with "--"
            for (field in info) {
                if (!info[field]) {
                    info[field] = "--";
                }
            }

            return tickerCollection.update({symbol: symbol}, {$set: {lastQueried: lastQueried, info: info}}).then(function(res) {
                return info;
            }, function(err) {
                return Promise.reject(err);
            });
        };

        // Returns the info field of the ticker document associated with the given symbol
        exports.getTickerInfo = function(symbol) {
            // Try to find ticker in the database
            return tickerCollection.find({symbol: symbol}).limit(1).toArray().then(function(listOfTickers) {
                // Check if ticker was found
                if (listOfTickers.length) {
                    var ticker = listOfTickers[0];

                    if (ticker.info) {
                        return ticker.info;
                    } else {
                        return Promise.reject("No info has been set for this ticker.");
                    }

                } else {
                    return Promise.reject("Could not find stock ticker.");
                }
            });
        };

        // Returns the info fields of the tickers with the given symbols
        exports.getMultTickerInfo = function(symbols) {

            if (symbols === null) {
                return Promise.reject("Invalid Arguments.");
            } else if (symbols.length === 0) {
                return Promise.resolve([]);
            }

            // Try to find ticker in the database
            return tickerCollection.find({symbol: {$in: symbols}}).toArray().then(function(listOfTickers) {

                // Check if tickers were found
                if (listOfTickers.length) {
                    var infoList = [];

                    for (ticker of listOfTickers) {
                        if (ticker.info.ChangeinPercent.charAt(0) === '+') {
                            ticker.info.change = "positive";
                        } else {
                            ticker.info.change = "negative";
                        }

                        infoList.push(ticker.info);
                    }

                    //console.log(infoList);

                    return infoList;
                } else {
                    return Promise.reject("Could not find stock tickers.");
                }
            });
        };
    });
