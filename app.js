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

app.use(session({
  secret: "#sms#",
  resave: true,
  saveUninitialized: true 
}));

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

<<<<<<< Updated upstream
=======
<<<<<<< HEAD
//Express Messages Middle ware
app.use(require("connect-flash")());
app.use(function(req, res, next ){
  res.locals.messages = require("express-messages")(req, res);
  next();
});
=======
>>>>>>> Stashed changes
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/signup");
  }
  next();
};
<<<<<<< Updated upstream
=======
>>>>>>> 7813f896817c8ccc1fd749705f68562dd62bd39f
>>>>>>> Stashed changes

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
      //flash msg no such user found
      return res.redirect("/results");
    }
    res.render("profile.ejs", { user: foundUser });
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
    console.log("Passwords do not match");
    //return res.redirect("/signup");
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
    res.send(e.message);
    console.log(e);
  }
});

<<<<<<< HEAD
app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/signup" }),
  (req, res) => {
    res.redirect(`/users/${req.user.id}`);
  }
);
=======
app.post("/login", function(req,res,next){
  passport.authenticate("local", { 
    failureRedirect: "/signup",
    successRedirect: "/profile",
    failureFlash: true
     })(req, res, next);
});

/*  
//Logout
router.get("/logout",function(req, res){
  req.logout();
  req.flash("success", "You are logged out");
  res.redirect("/signup");
});
*/
>>>>>>> 152fef81e939700fc21876cadd172bef02f00185

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/results");
});


const port = 3000;

app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
