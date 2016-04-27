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
                    tickerCollection.update({symbol: ticker.Symbol}, {$set: {symbol: ticker.Symbol, name: ticker.Name, market: 'NASDAQ'}}, {upsert: true});
                }
            } else {
                console.log(err);
            }
        });
        converter.fromFile("./static/csv/NYSE.csv", function (err, tickers) {
            if (tickers) {
                for (ticker of tickers) {
                    tickerCollection.update({symbol: ticker.Symbol}, {$set: {symbol: ticker.Symbol, name: ticker.Name, market: 'NYSE'}}, {upsert: true});
                }
            } else {
                console.log(err);
            }
        });
        converter.fromFile("./static/csv/AMEX.csv", function (err, tickers) {
            if (tickers) {
                for (ticker of tickers) {
                    tickerCollection.update({symbol: ticker.Symbol}, {$set: {symbol: ticker.Symbol, name: ticker.Name, market: 'AMEX'}}, {upsert: true});
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
                if (search.length > 0) {
                    var searchRegex = new RegExp("^" + search + "(.)*$");

                    return tickerCollection.find({symbol: { $regex: searchRegex, $options: 'i' }}).toArray().then(function(listOfTickers) {
                        return listOfTickers;
                    });
                } else {
                    return null;
                }
            } else {
                return Promise.reject("Search undefined.");
            }
        };

        /*
         *  Checks if the ticker with the given symbol has been updated in the last hour.
         *  Returns false if it hasn't and true if it has.
         */
        exports.isTickerUpToDate = function(symbol) {
            // Try to find ticker in the database
            return tickerCollection.find({symbol: symbol}).limit(1).toArray().then(function(listOfTickers) {
                // Check if ticker was found
                if (listOfTickers.length) {
                    var ticker = listOfTickers[0];

                    if (ticker.lastQueried) {
                        // If lastQueried has been set, check how many hours have passed since it was last set
                        var now = new Date();
                        var hoursPassed = Math.abs(now - ticker.lastQueried) / 36e5;

                        if (hoursPassed >= 1) {
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        // Return false if lastQueried hasn't been set yet
                        return false;
                    }
                } else {
                    return Promise.reject("Could not find stock ticker.");
                }
            });
        };

        // Updates the ticker with the given symbol with the given lastQueried date and query info
        exports.refreshTicker = function(symbol, lastQueried, info) {
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

                    return infoList;
                } else {
                    return Promise.reject("Could not find stock tickers.");
                }
            });
        };
    });
