const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

//====================DATABASE CONNECTION==========================
const dbUrl = "mongodb://localhost:27017/test";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "database connection error:"));
db.once("open", () => {
  console.log("Database connected!!");
});
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

const port = 3000;

app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
