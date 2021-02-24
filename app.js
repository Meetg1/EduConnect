const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const User = require("./models/user.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

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

app.get("/results", (req, res) => {
  res.render("results.ejs");
});

app.get("/upload", (req, res) => {
  res.render("upload.ejs");
});

app.get("/profile", (req, res) => {
  res.render("profile.ejs");
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
  if (password !== cpwd) {
    console.log("Passwords do not match");
    return res.redirect("/signup");
  }
  try {
    const { fullname, username, email, university } = req.body;
    const user = new User({ username: username, email: email, fullname: fullname, university: university });
    const registedUser = await User.register(user, password);
    console.log(registedUser);
    //res.send("Registered Successfully");
    res.redirect("/signup");
  } catch (e) {
    res.send(e.message);
    console.log(e);
  }
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/signup" }),
  (req, res) => {
    res.send("LOGIN SUCCESSFUL");
  }
);

const port = 3000;

app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
