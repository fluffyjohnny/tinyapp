const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const helpers = require("./helpers");
const salt = bcrypt.genSaltSync(10);
const methodOverride = require('method-override');

// ------------------------------ Middleware -----------------------------------

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['chickenButt', 'bokchoyBoy', 'babyJesus'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// ------------------------------------ Data -----------------------------------------

const { urlDatabase, users } = require('./database');

// ----------------------------- Helper Functions ------------------------------

const { generateRandomString, registeredEmail, verifyUser, getDate, getTime } = helpers(users, bcrypt);

// --------------------------------   GET ROUTES  -----------------------------------


// home page
app.get("/", (req, res) => {
  if (users[req.session['user_id']]) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});


// when the path is /urls, render the urls_index ejs for the client
app.get("/urls", (req, res) => {
  // if user is not logged in, redirect to /login
  if (!users[req.session['user_id']]) {
    res.status(401).redirect('/login');
  }
  // helper function to see if the cookie and userID matches
  const isItYourURL = (data) => {
    const newDatabase = {};
    for (const url in data) {
      if (data[url]['userID'] === req.session['user_id']) {
        newDatabase[url] = data[url];
      }
    }
    return newDatabase;
  };
  const templateVars = {
    user: users[req.session['user_id']],
    newURLS: isItYourURL(urlDatabase),
  };
  res.render('urls_index', templateVars);
});


// when the path is urls/new, render then urls_new ejs for the client
app.get("/urls/new", (req, res) => {
  if (!users[req.session['user_id']]) {
    res.status(401);
    res.redirect('/login');
  }
  const templateVars = {
    user: users[req.session['user_id']],
  };
  res.render("urls_new", templateVars);
});


// when the path is urls/shortURL, render urls_show ejs
app.get("/urls/:shortURL", (req, res) => {
  // if shortURL doesnt exist
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send('Page Not Found! Error Code: 404. Please Return to the Previous Page.');
  }
  // if user is not logged in
  if (!users[req.session['user_id']]) {
    res.status(401);
    res.redirect('/urls');
  }
  // if user is logged in, but does not own the short URL
  const index = req.params['shortURL'];
  if (urlDatabase[index].userID !== users[req.session['user_id']].id) {
    res.status(401).send('URL Belongs to Another User! Error Code: 401. Please Return to the Previous Page.');
  }
  // else render urls_show
  const templateVars = {
    shortURL: req.params.shortURL,
    data: urlDatabase[req.params.shortURL],
    user: users[req.session['user_id']],
  };
  res.render("urls_show", templateVars);
});


// redirect to longURL when clicked on shortURL, and throw 404 if short url isn't in the database
app.get("/u/:shortURL", (req, res) => {
  const ID = urlDatabase[req.params.shortURL];

  // doesn't exist in database, therefore error 404
  if (!ID) {
    res.status(404).send('Page Not Found! Error Code: 404. Please Return to the Previous Page.');
  }
  // if the new long URL does not include http://, add it
  let longURL = ID.longURL;
  if (!longURL.includes('://')) {
    longURL = `http://${longURL}`;
  }

  if (!ID.uniquePool.includes(req.session['user_id'])) {
    ID.uniquePool.push(req.session['user_id']);
    ID.uniqueClicks ++;
  }

  ID.logsTime.push(`${getDate()}, ${getTime()}`);
  ID.logsUser.push(req.session['user_id']);
  ID.clicks ++;
  res.redirect(longURL);
});


// when on /login, render url_login ejs
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session['user_id']],
  };
  // if already logged in, redirect to /urls
  if (users[req.session['user_id']]) {
    res.redirect('/urls');
  }
  // else render login page
  res.render('urls_login', templateVars);
});


// when on /register, render urls_register ejs
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session['user_id']],
  };
  // if already logged in, redirect to /urls
  if (users[req.session['user_id']]) {
    res.redirect('/urls');
  }
  // else redirect to register page
  res.render("urls_register", templateVars);
});


// bring user to the welcome page after successful login
app.get('/welcome_back', (req, res) => {
  const templateVars = {
    user: users[req.session['user_id']],
  };
  res.render('urls_welcomeBack', templateVars);
});


// list the JSON object string for our urlDatabase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// catches anything that is not in the designed route
app.get("*", (req, res) => {
  res.status(404).send("Error 404: Page Not Found");
});


// -------------------------------------- POST ROUTES ------------------------------------------------------

// check if the email and password matches the database, if yes welcome them, if no try again
app.post('/login', (req, res) => {
  const verifiedUser = verifyUser(req.body.email, req.body.password);
  const cookieGiver = (value) => {
    req.session['user_id'] = value;
  };
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('Input Field(s) Left Blank! Please Return to the Previous Page.');
  }
  // if email and password matches, give them a cookie and redirect them to the welcome page
  if (verifiedUser) {
    cookieGiver(verifiedUser.id, verifiedUser.passport);
    res.redirect('/welcome_back');
  }
  // if user's email and password doesn't match, send error code 403
  res.status(403).send('Incorrect Email or Password! Please Return to the Previous Page.');
});


// clear the user cookie and redirect to /urls, logging the user out
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


// input registration info into the user database, then assgining cookie for said user
app.post('/register', (req, res) => {
  // if submitted blanks, return error 400
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('Input Field(s) Left Blank! Please Return to the Previous Page.');
  }
  // if email is already in database, return error 400
  if (registeredEmail(req.body.email)) {
    res.status(400).send(`Email Already In Use! Status Code: ${res.statusCode}. Please Return to the Previous Page.`);
  }
  // else input their info into the database, assign cookies, and redirect to /urls
  const generatedID = generateRandomString(7);
  const hashedPassword = bcrypt.hashSync(req.body.password, salt);
  users[generatedID] = {
    id: generatedID,
    email: req.body.email,
    password: hashedPassword,
  };
  req.session['user_id'] = generatedID;
  res.redirect(`/urls`);
});


// for client to edit an existing longURL
app.put('/edit/:shortURL?', (req, res) => {
  const index = req.params['shortURL'];
  // if cookie does not match the userID, cannot edit longURL
  if (urlDatabase[index]['userID'] !== req.session['user_id']) {
    res.status(401).send('Unauthorized Edit, Error Code: 401. Please Return to the Previous Page.');
  }
  urlDatabase[index].longURL = req.body['updatedLongURL'];
  res.redirect('/urls');
});


// delete the url in our database
app.delete("/urls/:shortURL?", (req, res) => {
  const index = req.params['shortURL'];
  // if user is not logged in, error 401
  if (!users[req.session['user_id']]) {
    res.status(401).send('Unauthorized Access, Error Code: 401. Please Return to the Previous Page.');
  }
  // if cookie does not match the userID, cannot delete data from database
  if (urlDatabase[index]['userID'] !== req.session['user_id']) {
    res.status(401).send('Unauthorized Edit, Error Code: 401. Please Return to the Previous Page.');
  }
  // else delete from database
  delete urlDatabase[index];
  res.redirect('/urls');
});


// to edit longURL, redirecting the client to the corresponding urls_show page
app.post('/urls/:shortURL', (req, res) => {
  const index = req.params['shortURL'];
  // if user is not logged in
  if (!users[req.session['user_id']]) {
    res.status(401).send('Unauthorized Access, Error Code: 401. Please Return to the Previous Page.');
  }
  // if user does not own the url, error 401
  if (urlDatabase[index].userID !== users[req.session['user_id']].id) {
    res.status(401).send('Unauthorized Edit, Error Code: 401. Please Return to the Previous Page.');
  }
  // else redirect
  res.redirect(`/urls/${index}`);
});


// from urls_ new, generate a randomized string for the longURL, and assigning it into the database
app.post("/urls", (req, res) => {
  let generatedURL = generateRandomString(7);
  // if not logged in, error
  if (!users[req.session['user_id']].id) {
    res.status(401).send('Unauthorized Acess, Error Code: 401. Please Return to the Previous Page.');
  }
  // if logged in, generate new URL and save it to the database, then redirect to the generated link
  urlDatabase[generatedURL] = {
    longURL: 'http://' + req.body.longURL,
    userID: req.session['user_id'],
    time: getDate(),
    uniquePool: [],
    logsUser: [],
    logsTime: [],
    uniqueClicks: 0,
    clicks: 0,
  };
  res.redirect(`/urls/${generatedURL}`);
});

// ---------------------------------- LISTEN ----------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



module.exports = app;