const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const User = require("./models/user.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); //for serving static files
app.use(express.urlencoded({ extended: true })); //for parsing form data

app.use(
  session({
    secret: "#sms#",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(flash());

//====================DATABASE CONNECTION==========================
const dbUrl = "mongodb://localhost:27017/test";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "database connection error:"));
db.once("open", () => {
  console.log("Database connected!!");
});
//===================================================================

//========================PASSPORT SETUP=============================
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//===================================================================

//Express Messages Middle ware
app.use(require("connect-flash")());
app.use(function (req, res, next) {
  res.locals.currentUser = req.user; //giving access of loggedIn user to every templates(in views dir)
  res.locals.messages = require("express-messages")(req, res);
  next();
});
// =======
// >>>>>>> Stashed changes
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("/signup");
  }
  next();
};
// >>>>>>> Stashed changes

app.get("/results", (req, res) => {
  res.render("results.ejs");
});

app.get("/upload", isLoggedIn, (req, res) => {
  res.render("upload.ejs");
});

app.get("/users/:user_id", isLoggedIn, async (req, res) => {
  try {
    foundUser = await User.findById(req.params.user_id);
    if (!foundUser) {
      req.flash("danger", "No such user found");
      return res.redirect("/results");
    }
    res.render("profile.ejs");
  } catch (error) {
    console.error(error);
  }
});

app.get("/landing", (req, res) => {
  res.render("landing.ejs");
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.get("/single_material", (req, res) => {
  res.render("single_material.ejs");
});

app.post("/register", async (req, res) => {
  const { password, cpwd } = req.body;
  if (password != cpwd) {
    req.flash("danger", "Passwords do not match");
    return res.redirect("/signup");
  }
  try {
    const { fullname, username, email, university } = req.body;
    const user = new User({
      username: username,
      email: email,
      fullname: fullname,
      university: university,
    });
    const registedUser = await User.register(user, password);
    console.log(registedUser);
    //res.send("Registered Successfully");
    req.flash("success", "You are now registered");

    res.redirect("/signup");
  } catch (e) {
    req.flash("danger", "That username is already taken!");
    return res.redirect("/signup");
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    failureRedirect: "/signup",
    successRedirect: "/results",
    failureFlash: true,
  })(req, res, next);
});

//Logout
app.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "You are logged out");
  res.redirect("/signup");
});

const port = 3000;

app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
