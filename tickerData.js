var MongoClient = require('mongodb').MongoClient,
    settings = require('./config.js'),
    Converter = require("csvtojson").Converter;

var fullMongoUrl = settings.mongoConfig.serverUrl + settings.mongoConfig.database;
var exports = module.exports = {};

// Create "tickers" collection if it does not already exist
MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        db.createCollection("tickers");

        var tickerCollection = db.collection("tickers");
        var converter = new Converter({});

        // Populate tickers collection
        converter.fromFile("./static/csv/NASDAQ.csv", function (err, tickers) {
            if (tickers) {
                for (ticker of tickers) {
                    tickerCollection.update({symbol: ticker.Symbol}, {symbol: ticker.Symbol, name: ticker.Name, market: 'NASDAQ'}, {upsert: true});
                }
            } else {
                console.log(err);
            }
        });
        converter.fromFile("./static/csv/NYSE.csv", function (err, tickers) {
            if (tickers) {
                for (ticker of tickers) {
                    tickerCollection.update({symbol: ticker.Symbol}, {symbol: ticker.Symbol, name: ticker.Name, market: 'NYSE'}, {upsert: true});
                }
            } else {
                console.log(err);
            }
        });
        converter.fromFile("./static/csv/AMEX.csv", function (err, tickers) {
            if (tickers) {
                for (ticker of tickers) {
                    tickerCollection.update({symbol: ticker.Symbol}, {symbol: ticker.Symbol, name: ticker.Name, market: 'AMEX'}, {upsert: true});
                }
            } else {
                console.log(err);
            }
        });

        return true;
    });

// Exported mongo functions
MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        var tickerCollection = db.collection("tickers");

        // Searches the database given a search and returns an array of all matched documents
        exports.getTickerSearchSuggestions = function(search) {
            if (search && search.length > 0) {
                var searchRegex = new RegExp("^" + search + "(.)*$");

                return tickerCollection.find({symbol: { $regex: searchRegex, $options: 'i' }}).toArray().then(function(listOfTickers) {
                    return listOfTickers;
                });
            } else {
                return Promise.reject(true);
            }
        };

        /*
        exports.isStockUpToDate = function(stockSymbol) {
            return tickerCollection.find({symbol: stockSymbol}).toArray().then(function(listOfTickers) {
                //
                if (listOfTickers.length) {
                    var ticker = listOfTickers[0];

                    if (ticker.lastDate) {

                    } else {
                        return false;
                    }
                } else {
                    return Promise.reject("Could not find stock ticker.");
                }
            });
        };
        */
    });
