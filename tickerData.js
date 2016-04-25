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

        // Logs a user in if the hash of the given password matches the hash associated with the given username in database.
        // Returns the generated sessionID as a Promise if the log in is successful
        exports.logIn = function (username, password) {

            // Error checking
            if (!username || !password) {
                return Promise.reject("You must provide both a username and password.");
            } else if (typeof username !== 'string' || typeof password !== 'string') {
                return Promise.reject("Arguments not correct type.");
            }

            return usersCollection.find({"username": username}).limit(1).toArray().then(function(listOfUsers) {
                // If user exists, check password
                if (listOfUsers.length !== 0) {
                    var user = listOfUsers[0];

                    // Compare hash of given password to hash in the db
                    if (bcrypt.compareSync(password, user.encryptedPassword)) {
                        // Create a new session ID for the user and update the user in the database
                        var sessionID = Guid.create().toString();

                        return usersCollection.update({"username": username}, {$set: {"currentSessionId": sessionID}}).then(function() {
                            return Promise.resolve(sessionID);
                        });
                    } else {
                        return Promise.reject("Incorrect password.");
                    }

                } else {
                    return Promise.reject("A user with that username does not exist.");
                }
            });
        };

        // Logs out the user with the given sessionID
        exports.logOut = function (userId) {

            // Error checking
            if (!userId) {
                return Promise.reject("Invalid argument(s).")
            }

            // Clear the sessionID for the logged out user
            return usersCollection.update({"_id": userId}, {$set: {"currentSessionId": ""}}).then(function() {
                return Promise.resolve(true);
            });

        };

        // Gets a user with the given sessionID, returns null if the user does not exist
        exports.getUserBySessionID = function (sessionID) {

            // Error checking
            if (sessionID) {
                return usersCollection.findOne({ "currentSessionId": sessionID });
            } else {
                return Promise.resolve(null);
            }
        };

        // Adds the given info to the user profile in the database
        exports.editUserInfo = function (userId, info) {

            // Error checking
            if (!userId || !info || typeof info !== 'object') {
                return Promise.reject("Invalid argument(s).");
            }

            // Update profile
            return usersCollection.update({"_id": userId}, {$set: {
                'profile.firstName': info.firstName,
                'profile.lastName': info.lastName,
                'profile.hobby': info.hobby,
                'profile.petName': info.petName
            }}).then(function() {
                return Promise.resolve(true);
            });
        };
    });
