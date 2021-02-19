const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

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

app.listen(3000, (err) => {
  console.log("Server started on port 3000");
});
