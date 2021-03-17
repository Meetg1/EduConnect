const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const User = require("./models/user.js");
const Document = require("./models/Document.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const multer = require("multer");
const { uploadToDrive, picToDrive } = require("./driveApi.js");
const expressValidator = require('express-validator');

app.use(express.json());
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

// Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value){
    var namespace = param.split("."),
    root = namespace.shift(),
    formParam = root;

    while(namespace.length){
      formParam += "[" + namespace.shift() + "]";
    }
    return {
      param : formParam,
      msg : msg,
      value : value
    };
  }
})); 

const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("/signup");
  }
  next();
};

//=======================MULTER=====================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage });
var file;
app.post("/uploadfile", upload.single("file"), (req, res, next) => {
  file = req.file;
  console.log(file);
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  res.send(file);
});

var previewPics = [];
var previewPicIds = []
app.post("/uploadpics", upload.single("file"), (req, res, next) => {
  previewPics.push(req.file);
  // console.log(file);
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  res.send(file);
});
//============================================================

app.post("/upload", isLoggedIn, async (req, res) => {
  console.log(req.body);
  try {
    const uploadedFile = await uploadToDrive(file.originalname, file.mimetype);
    if (uploadedFile) {
      console.log(uploadedFile.data.id);
    }
    for (let i = 0; i < previewPics.length; i++) {
      const uploadedPic = await picToDrive(previewPics[i].originalname, previewPics[i].mimetype);
      previewPicIds.push(uploadedPic.data.id)
    }

    const{ university, course, title, category, date, topic, num_pages, description } = req.body;
    const driveId = uploadedFile.data.id;
    const uploader = {
      id: req.user._id,
      username: req.user.username
    }


    const doc = new Document({
      university: university,
      course: course,
      title: title,
      category: category,
      date : date,
      topic: topic,
      num_pages: num_pages,
      description: description,
      uploader: uploader,
      driveId: driveId,
      previewPics : previewPicIds
    });
    doc.save(function(err){
      if(err)
        console.log(err);
      else
        console.log(doc);
    });
    
    
    // const uploadedPic = await picToDrive(
    //   previewPics[1].originalname,
    //   previewPics[1].mimetype
    // );
    // const uploadedPic = await picToDrive(
    //   previewPics[2].originalname,
    //   previewPics[2].mimetype
    // );

  } catch (error) {
    console.log(error);
  }
});

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
  try {
    const { fullname, username, email, university, password, cpwd } = req.body;

    req.checkBody("fullname", "Name is required").notEmpty();
    req.checkBody("university", "University is required").notEmpty();
    req.checkBody("email", "Enter a valid Email-id").isEmail();
    req.checkBody("password", "Password is required").notEmpty();
    req.checkBody("cpwd", "Passwords do not match").equals(req.body.password);

    let errors = req.validationErrors();
    if(errors){
      console.log(errors);
     res.render("signup.ejs",{
       errors: errors
     });
    }
    else{
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

    }

    
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
