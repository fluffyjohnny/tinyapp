const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());


// ----------------------------- Helper Functions ------------------------------

const generateRandomString = () => {
  let str = '';
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 7; i++) {
    str += char.charAt(Math.floor(Math.random() * char.length));
  }
  return str;
};

const registeredEmail = (email) => {
  for (let id in users) {
    if (users[id].email === email) {
      return true;
    }
  }
  return false;
};

const verifyUser = (email, password) => {
  for (const user in users) {
    if (users[user].email === email && users[user].password === password) {
      return users[user];
    }
  }
  return false;
};


// ------------------------------------ Data --------------------------------------------------------------

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// --------------------------------   GET ROUTES  -------------------------------------------------------

// home page
app.get("/", (req, res) => {
  res.send("Hello!");
});

// when the path is /urls, render the urls_index ejs for the client
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']],
  };
  console.log('users', users);
  res.render('urls_index', templateVars);
  res.end();
});

// when the path is urls/new, render then urls_new ejs for the client
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']],
  };
  res.render("urls_new", templateVars);
  res.end();
});

// when the path is urls/shortURL, render urls_show ejs
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']],

  };
  res.render("urls_show", templateVars);
  res.end();
});

// when on /register, render urls_register ejs
app.get("/register", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']],
  };
  res.render("urls_register", templateVars);
  res.end();
});

// when on /login, render url_login ejs
app.get("/login", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']],
  };

  res.render('urls_login', templateVars);
  res.end();
});

// bring user to the welcome page after successful login
app.get('/welcome_back', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']],
  };
  res.render('urls_welcomeBack', templateVars);
  res.end();
});

// list the JSON object string
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
  res.end();
});

// log hello world to client
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
  res.end();
});

// redirect to longURL when clicked on shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params['shortURL']];
  if (!longURL.includes('://')) {
    longURL = `http://${longURL}`;
  }
  res.redirect(longURL);
});


// -------------------------------------- POST ROUTES ------------------------------------------------------

// check if the email and password matches the database, if yes welcome them, if no try again
app.post('/login', (req, res) => { //
  
  const candidateEmail = req.body.email;
  const candidatePassword = req.body.password;
  const verifiedUser = verifyUser(candidateEmail, candidatePassword);
  const cookieGiver = (value) => {
    res.cookie('user_id',value);
  };
    // if user's email and password doesn't match, send error code 403 and redirect back to /login
  if (!verifiedUser) {
    res.statusCode = 403;
    res.redirect('/login');

    // if email and password matches, give them a cookie and redirect them to the welcome page
  } else if (verifiedUser) {
    cookieGiver(verifiedUser.id);
    res.redirect('/welcome_back');
  }
});

// clear the user cookie and redirect to /urls
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// for client to edit an existing longURL
app.post('/edit/:shortURL', (req, res) => {
  const index = req.params['shortURL'];
  urlDatabase[index] = req.body['updatedLongURL'];
  res.redirect('/urls');
});

// delete the url in our database
app.post("/urls/:shortURL/delete", (req, res) => {
  const index = req.params['shortURL'];
  delete urlDatabase[index];
  res.redirect('/urls');
});

// redirecting the client to the corresponding urls_show page
app.post('/urls/:shortURL', (req, res) => {
  const index = req.params['shortURL'];
  res.redirect(`/urls/${index}`);
});

// generate a randomized string for the longURL, and assigning it into the database
app.post("/urls", (req, res) => {
  let generatedURL = generateRandomString();
  urlDatabase[generatedURL] = req.body.longURL;
  res.redirect(`/urls/${generatedURL}`);
});

// input registration info into the user database, then assgining cookie for said user
app.post('/register', (req, res) => {

  // if submitted blanks, return error 400
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400;
    res.write(`Empty Input! Status Code: ${res.statusCode}`);
    res.end();
  }

  // if email is already in database, return error 400
  if (registeredEmail(req.body.email)) {
    res.statusCode = 400;
    res.write(`Email Already In Use! Status Code: ${res.statusCode}`);
    res.end();
  }

  // else input their info into the database, assign cookies, and redirect to /urls
  const generatedID = generateRandomString();
  users[generatedID] = {
    id: generatedID,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', generatedID);
  res.redirect(`/urls/new`);
});


// ---------------------------------- LISTEN ----------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});