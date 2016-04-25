var MongoClient = require('mongodb').MongoClient,
    settings = require('./config.js'),
    Guid = require('Guid'),
    bcrypt = require('bcrypt-nodejs');

var fullMongoUrl = settings.mongoConfig.serverUrl + settings.mongoConfig.database;
var exports = module.exports = {};

// Drop "users" collection if it already exists and then re-create it
MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        return db.createCollection("users");
    });

// Exported mongo functions
MongoClient.connect(fullMongoUrl)
    .then(function(db) {
        var usersCollection = db.collection("users");

        // Adds a new user if one does not already exist with the given username
        exports.addUser = function (username, password, confirm) {

            // Error checking
            if (!username || !password || !confirm) {
                return Promise.reject("Please make sure to fill out all fields.");
            } else if (typeof username !== 'string' || typeof password !== 'string') {
                return Promise.reject("Arguments not correct type.");
            } else if (password !== confirm) {
                return Promise.reject("Please make sure your passwords match.");
            }

            return usersCollection.find({"username": username}).limit(1).toArray().then(function(listOfUsers) {
                if (listOfUsers.length !== 0) {
                    return Promise.reject("A user with that username already exists.");
                } else {
                    return bcrypt.hash(password, null, null, function(err, hash) {
                        // Store hash in your password DB.
                        return usersCollection.insertOne({
                            _id: Guid.create().toString(),
                            username: username,
                            encryptedPassword: hash,
                            currentSessionId: "",
                            profile: {
                                firstName: "",
                                lastName: "",
                                hobby: "",
                                petName: ""
                            }
                        });
                    });
                }
            });
        };
    });
