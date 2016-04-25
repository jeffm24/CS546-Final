// We first require our express package
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var userData = require('./data.js');

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

        response.render('pages/profile', {
            pageTitle: 'Profile',
            username: user.username,
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
                //console.log("Created new sessionID cookie: {sessionID: " + sessionID + "}");

                response.json({status: "success"});
            }
        }, function(errorMessage) {
            response.status(500).json({ error: errorMessage });
        });

    } else {
        reponse.status(500).json({error: "User already signed in."})
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
        reponse.status(500).json({error: "User already signed in."})
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

// We can now navigate to localhost:3000
app.listen(3000, function() {
    console.log('Your server is now listening on port 3000! Navigate to http://localhost:3000 to access it');
});
