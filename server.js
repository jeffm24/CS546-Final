// We first require our express package
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var httpRequest = require('request');
var userData = require('./userData.js');
var tickerData = require('./tickerData.js');
var historicalData = require('./historicalData.js');
// We create our express isntance:
var app = express();

// Here we change our view engine from Jade (default) to EJS
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/assets', express.static('static'));

// Middleware for checking if the user is logged in
app.use(function(request, response, next) {
    userData.getUserBySessionID(request.cookies.sessionID).then(function(user) {
        // If the user is logged in, set response.locals.user to the user
        if (user) {
            response.locals.user = user;
        } else {
            response.locals.user = undefined;
        }

        next();
    });
});

// Redirects to "/profile" or renders the sign in/sign up page depending on whether the user is logged in or not
app.get("/", function(request, response) {

    // If the user is logged in, redirect to '/profile', otherwise render the signIn/signUp page
    if (response.locals.user) {
        response.redirect('/profile');
    } else {
        response.render('pages/signInUp', {pageTitle: 'Sign In/Register'});
    }

})

// Display the user profile if they are logged in, otherwise redirect to "/"
app.get("/profile", function(request, response) {

    // If the user is logged in, render the profile page, otherwise redirect to '/'
    if (response.locals.user) {
        var user = response.locals.user;

        tickerData.getMultTickerInfo(user.savedTickers).then(function(tickers) {
            response.render('pages/profile', {
                pageTitle: 'Profile',
                username: user.username,
                tickers: tickers
            });
        });

    } else {
        response.redirect('/');
    }

});

//
app.get("/account", function(request, response){
  // If the user is logged in, render the profile page, otherwise redirect to '/'
  if (response.locals.user) {
      var user = response.locals.user;

      response.render('pages/editAccount', {
          pageTitle: 'Edit Account',
          username: user.username,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          hobby: user.profile.hobby,
          petName: user.profile.petName
      });
  } else {
      response.redirect('/');
  }
});


// Updates user info using the given request body
app.post("/profile/editUserInfo", function(request, response) {

    // Only run editUserInfo function if the user is currently logged in
    if (response.locals.user) {

        userData.editUserInfo(response.locals.user._id, request.body).then(function(val) {
            response.json({status: 'success'});
        }, function(errorMessage) {
            response.status(500).json({ error: errorMessage });
        });
    } else {
        response.status(500).json({error: "User not signed in."});
    }

});

// Route to log the user in
app.post("/signin", function(request, response) {

    // Only run logIn function if the user is not currently logged in
    if (!response.locals.user) {

        // Log the user in and then set the session cookie
        userData.logIn(request.body.username, request.body.password).then(function(sessionID) {
            if (sessionID) {
                // If the user was successfully signed in, create a new cookie with the generated sessionID
                var expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 5);

                response.cookie("sessionID", sessionID, { expires: expiresAt });

                response.json({status: "success"});
            }
        }, function(errorMessage) {
            response.status(500).json({ error: errorMessage });
        });

    } else {
        response.status(500).json({error: "User already signed in."});
    }

});

// Route to sign the user out
app.post("/signout", function(request, response) {

    // Only run logOut function if the user is currently logged in
    if (response.locals.user) {

        // Log the user out and then remove the session cookie
        userData.logOut(response.locals.user._id).then(function(res) {
            if (res) {
                var anHourAgo = new Date();
                anHourAgo.setHours(anHourAgo.getHours() -1);

                // invalidate, then clear so that lastAccessed no longer shows up on the cookie object
                response.cookie("sessionID", "", { expires: anHourAgo });
                response.clearCookie("sessionID");

                response.json({status: "success"});
            }
        }, function(errorMessage) {
            response.status(500).json({ error: errorMessage });
        });

    } else {
        response.status(500).json({error: "User not signed in."});
    }

});

// Route for signing a user up
app.post("/register", function(request, response) {

    // Only run addUser function if the user is not currently logged in
    if (!response.locals.user) {

        userData.addUser(request.body.username, request.body.password, request.body.confirm).then(function(val) {
            response.json({status: request.body.username + " successfully added. Please try logging in."});
        }, function(errorMessage) {
            response.status(500).json({ error: errorMessage });
        });

    } else {
        response.status(500).json({error: "User already signed in."})
    }

});

// Route for getting ticker suggestions based on a given search
app.post("/getTickerSearchSuggestions", function(request, response) {

    tickerData.getTickerSearchSuggestions(request.body.search).then(function(result) {
        response.json({suggestions: result});
    }, function(errorMessage) {
        response.status(500).json({error: errorMessage});
    });

});

app.post("/searchHistory", function(request, response) {
    // console.log(request.body.ticker);
    // console.log(request.body.start);
    // console.log(request.body.end);
    historicalData.checkDates(request.body.ticker,request.body.start,request.body.end).then(function(result) {

        if(result === null){
            console.log("TICKER NOT FOUND");
            var end = new Date();
            var start = new Date();
            start.setFullYear(end.getFullYear()-1);
            start = start.toISOString().split('T')[0];
            end = end.toISOString().split('T')[0];

            var inputURL = "http://query.yahooapis.com/v1/public/yql"+
                          "?q=select%20*%20from%20yahoo.finance.historicaldata%20"+
                          "where%20symbol%20%3D%20%22"
                          +request.body.ticker+"%22%20and%20startDate%20%3D%20%22"
                          +start+"%22%20and%20endDate%20%3D%20%22"
                          +end+"%22&format=json&env=store%3A%2F%2F"
                          +"datatables.org%2Falltableswithkeys";

            httpRequest(inputURL, function (error, data, body) {

                if (!error && data.statusCode == 200) {

                    var query = JSON.parse(body).query;
                    var info = query.results.quote;
                    // Check to see if actual data was recieved
                    if (info) {
                      // Update the ticker in the database with the results from the Yahoo query
                        historicalData.addTicker(request.body.ticker,info).then(function() {
                          return  historicalData.getData(request.body.ticker,request.body.start,request.body.end)
                        }).then(function(data) {
                              //console.log(data);
                              response.json({result: data});
                            });
                    } else {
                          response.json({result: "Query returned no results.", notFound: true});
                      }
                    } else {
                          response.status(500).json({error: error});
                      }
            });
      }

      else if(result == request.body.end){
          console.log("TICKER UP TO DATE");
          historicalData.getData(request.body.ticker,request.body.start,request.body.end).then(function(data) {
              response.json({result: data});
            });
      }
      else {
          console.log("TICKER NEEDS UPDATING FROM " + result + " to " + request.body.end);
          var end = new Date();
          var start = new Date(result);
          start.setDate(start.getDate() + 1);
          start = start.toISOString().split('T')[0];
          end = end.toISOString().split('T')[0];
          var inputURL = "http://query.yahooapis.com/v1/public/yql"+
                        "?q=select%20*%20from%20yahoo.finance.historicaldata%20"+
                        "where%20symbol%20%3D%20%22"
                        +request.body.ticker+"%22%20and%20startDate%20%3D%20%22"
                        +start+"%22%20and%20endDate%20%3D%20%22"
                        +end+"%22&format=json&env=store%3A%2F%2F"
                        +"datatables.org%2Falltableswithkeys";

          httpRequest(inputURL, function (error, data, body) {

              if (!error && data.statusCode == 200) {

                  var query = JSON.parse(body).query;

                  //console.log(info);
                // Update the ticker in the database with the results from the Yahoo query
                  if(query.results){
                    var info = query.results.quote;
                    historicalData.addTicker(request.body.ticker,info).then(function() {
                      return  historicalData.getData(request.body.ticker,request.body.start,request.body.end)
                    }).then(function(data) {
                          //console.log(data);
                          response.json({result: data});
                        });
                  } else {
                    historicalData.getData(request.body.ticker,request.body.start,request.body.end).then(function(data) {
                        //console.log(data);
                        response.json({result: data});
                      });
                  }

              } else {
                    response.status(500).json({error: error});
                }
          });
      }

    }, function(errorMessage) {
        response.json({result: errorMessage, notFound: true});
    });
});
// Search route
app.post("/search", function(request, response) {

    // Check if the ticker is up to date in the database before querying yahoo finance
    tickerData.isTickerUpToDate(request.body.search).then(function(upToDate) {

        if (upToDate) {
            // If the ticker is up to date, then just get the ticker info from the database and respond with it
            tickerData.getTickerInfo(request.body.search).then(function(tickerInfo) {

                tickerInfo.userSavedTickers = response.locals.user.savedTickers;

                if (tickerInfo.ChangeinPercent.charAt(0) === '+') {
                    tickerInfo.change = "positive";
                } else {
                    tickerInfo.change = "negative";
                }

                // Success respond with the ticker info
                response.json({result: tickerInfo});
            });
        } else {
            //console.log("Ticker info for " + request.body.search + " not up to date.");

            // If the ticker is not up to date, then query yahoo finance and update it before responding
            httpRequest('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20in%20(%22' + request.body.search + '%22)%0A%09%09&format=json&env=http%3A%2F%2Fdatatables.org%2Falltables.env&callback=', function (error, data, body) {
                if (!error && data.statusCode == 200) {

                    var query = JSON.parse(body).query;
                    var lastQueried = new Date(query.created);
                    var info = query.results.quote;

                    // Check to see if actual data was recieved
                    if (info.Open) {

                        // Update the ticker in the database with the results from the Yahoo query
                        tickerData.refreshTicker(request.body.search, lastQueried, info).then(function(tickerInfo) {

                            tickerInfo.userSavedTickers = response.locals.user.savedTickers;

                            if (info.ChangeinPercent.charAt(0) === '+') {
                                tickerInfo.change = "positive";
                            } else {
                                tickerInfo.change = "negative";
                            }

                            // Success respond the ticker info
                            response.json({result: tickerInfo});
                        });
                    } else {
                        response.json({result: "Query returned no results.", notFound: true});
                    }
                } else {
                    response.status(500).json({error: error});
                }
            });
        }

    }, function(errorMessage) {
        response.json({result: errorMessage, notFound: true});
    });

});

// Route for saving a ticker
app.post("/saveTicker", function(request, response) {

    if (response.locals.user) {
        userData.saveTicker(response.locals.user._id, request.body.symbol).then(function(result) {
            response.json({result: "Successfully added ticker."});
        }, function(errorMessage) {
            response.status(500).json({error: errorMessage});
        });
    } else {
        response.status(500).json({error: "User not signed in."});
    }

});

// Route for removing a ticker
app.delete("/removeTicker", function(request, response) {

    if (response.locals.user) {
        userData.deleteTicker(response.locals.user._id, request.body.symbol).then(function(result) {
            response.json({result: "Successfully removed ticker."});
        }, function(errorMessage) {
            response.status(500).json({error: errorMessage});
        });
    } else {
        response.status(500).json({error: "User not signed in."});
    }

});

// We can now navigate to localhost:3000
app.listen(3000, function() {
    console.log('Your server is now listening on port 3000! Navigate to http://localhost:3000 to access it');
});
