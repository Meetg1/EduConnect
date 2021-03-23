const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const courses = require("./courses")
const mongoose = require("mongoose");
const User = require("./models/user.js");
const Document = require("./models/Document.js");
const Review = require("./models/Review.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const multer = require("multer");
const {
  uploadToDrive,
  picToDrive,
  getFileFromDrive
} = require("./driveApi.js");
const expressValidator = require('express-validator');

app.use(express.json());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); //for serving static files
app.use(express.urlencoded({
  extended: true
})); //for parsing form data
app.use(flash());

app.use(
  session({
    secret: "#sms#",
    resave: true,
    saveUninitialized: true,
  })
);



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
  errorFormatter: function (param, msg, value) {
    var namespace = param.split("."),
      root = namespace.shift(),
      formParam = root;

    while (namespace.length) {
      formParam += "[" + namespace.shift() + "]";
    }
    return {
      param: formParam,
      msg: msg,
      value: value
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
  },limits: {
    fileSize: 100000000 // max file size 100MB 
  },
});

var upload = multer({
  storage: storage
});

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

app.get('/download/:document_id', async (req, res) => { 
  
  try {
    const doc = await Document.findById(req.params.document_id);   
    console.log("here")
    await getFileFromDrive(doc.driveId,doc.fileName)
    setTimeout(function(){ 
      res.download(__dirname +'/downloads/'+doc.fileName);
    }, 3000); 
    
  } catch (error) {
    res.status(400).send('Error while downloading file. Try again later.');
  }
  
});


//============================================================

app.post("/upload", isLoggedIn, async (req, res) => {
  // console.log(req.body);
  try {
    const uploadedFile = await uploadToDrive(file.originalname, file.mimetype);
    if (uploadedFile) {
      console.log(uploadedFile);
    }
    for (let i = 0; i < previewPics.length; i++) {
      const uploadedPic = await picToDrive(previewPics[i].originalname, previewPics[i].mimetype);
      previewPicIds.push(uploadedPic.data.id)
    }

    const {
      university,
      course,
      title,
      category,
      date,
      topic,
      num_pages,
      description
    } = req.body;
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
      date: date,
      topic: topic,
      num_pages: num_pages,
      description: description,
      uploader: uploader,
      driveId: driveId,
      mimeType: file.mimetype,
      fileName: file.originalname,
      previewPics: previewPicIds
    });

    const uploadedDoc = await doc.save()
    console.log(uploadedDoc);
    const foundUser = await User.findById(req.user._id);
    foundUser.uploads = foundUser.uploads + 1;
    foundUser.points = foundUser.points + 20;
    if (doc.category == "Lecture Notes") {
      foundUser.notes_uploads++;
    } else if (doc.category == "Question Paper") {
      foundUser.papers_uploads++;
    } else if (doc.category == "Assignment") {
      foundUser.assignments_uploads++;
    }
    foundUser.save();

  } catch (error) {
    console.log(error);
  }
});

app.get("/results", function (req, res) {
  
  Document.find({}, function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.render("results.ejs", {
        docs: docs

      });
    }
  });
});

app.post('/single_material/:document_id/reviews', isLoggedIn,async (req, res) => {
  console.log(req.body)
  const upvote = (req.body.upDown == 'upvote') ? true : false;
  const review = new Review({
    upvote: upvote,
    text: req.body.text,
    author: req.user._id
  })

  const foundDoc = await Document.findById(req.params.document_id)
  if(review.upvote){
      console.log("upvote done");
      foundDoc.upvotes++; 
  }
  else{
      console.log("downvote done");
      foundDoc.downvotes++;
  }
  foundDoc.reviews.push(review);
  foundDoc.save();

  const docOwner = await User.findById(foundDoc.uploader.id)
  docOwner.upvotes++;

  const user = await User.findById(req.user._id);
  user.points += 5;

  await review.save();
  await foundDoc.save();
  await user.save();
  await docOwner.save();

  console.log(review)
  
  req.flash('success', 'Review submitted successfully!');
  res.redirect("/single_material/"+req.params.document_id);

})

app.get("/upload", isLoggedIn, (req, res) => {
  res.render("upload.ejs", {
    courses
  });
});

app.get("/users/:user_id", isLoggedIn, async (req, res) => {
  try {
    foundUser = await User.findById(req.params.user_id);

    if (!foundUser) {
      req.flash("danger", "No such user found");
      return res.redirect("/results");
    } else {
      Document.find().where('uploader.id').equals(foundUser.id).exec(function (err, docs) {
        if (err) {
          console.log(err);
        } else {
          res.render("profile.ejs", {
            docs: docs
          });
        }
      });

    }
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



app.get("/single_material/:document_id", async function (req, res) {
  const doc = await Document.findById(req.params.document_id).populate({
    path: 'reviews',
    populate: {
      path: 'author'
    }
  }).populate('author');
  if (!doc) {
    req.flash('danger', 'Cannot find that document!');
    return res.redirect('/results');
  }
  res.render('single_material.ejs', { doc });

});

app.post("/register", async (req, res) => {
  try {

    const {
      fullname,
      university,
      username,
      password
    } = req.body;

    req.checkBody("fullname", "Name is required").notEmpty();
    req.checkBody("university", "University is required").notEmpty();
    req.checkBody("username", "Enter a valid Email-id").isEmail();
    req.checkBody("password", "Password is required").notEmpty();
    req.checkBody("cpwd", "Passwords do not match").equals(req.body.password);

    let errors = req.validationErrors();
    if (errors) {
      res.render("signup.ejs", {
        errors
      });
    } else {
      const user = new User({
        username: username,
        fullname: fullname,
        university: university,
      });
      const registedUser = await User.register(user, password);
      console.log(registedUser);
      req.flash("success", "You are now registered");
      res.redirect("/signup");
    }
  } catch (error) {
    req.flash("danger", "That email is already registered!");
    return res.redirect("/signup")
  }

});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    failureRedirect: "/signup",
    successRedirect: "/results",
    failureFlash: true,
    successFlash: "Welcome to EduConnect " + req.body.username + "!",
  })(req, res, next);
});

//Logout
app.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "Logged Out Successfully.");
  res.redirect("/signup");
});


const port = 3000;

app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});