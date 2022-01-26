const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = () => {
  let str = '';
  const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 7; i++) {
    str += char.charAt(Math.floor(Math.random() * char.length));
  }
  return str;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVar = {
    urls: urlDatabase,
    username: req.cookies['username'],
  };
  res.render('urls_index', templateVar);
});

app.get("/urls/new", (req, res) => {
  const templateVar = {
    username: req.cookies['username'],
  };
  res.render("urls_new", templateVar);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies['username']
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params['shortURL']];
  if (!longURL.includes('://')) {
    longURL = `http://${longURL}`;
  }
  res.redirect(longURL);
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body['username']);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post('/edit/:shortURL', (req, res) => {
  const index = req.params['shortURL'];
  urlDatabase[index] = req.body['updatedLongURL'];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const index = req.params['shortURL'];
  delete urlDatabase[index];
  res.redirect('/urls');
});

app.post('/urls/:shortURL', (req, res) => {
  const index = req.params['shortURL'];
  res.redirect(`/urls/${index}`); // need to get shortURL
});


app.post("/urls", (req, res) => {
  let generatedURL = generateRandomString();
  urlDatabase[generatedURL] = req.body.longURL;
  console.log(req.body);
  res.redirect(`/urls/${generatedURL}`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});