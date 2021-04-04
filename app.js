const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const courses = require("./courses")
const mongoose = require("mongoose");
const User = require("./models/user.js");
const Document = require("./models/Document.js");
const Review = require("./models/Review.js");
const Notification = require("./models/Notification");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const flash = require("connect-flash");
const multer = require("multer");
const jwt=require("jsonwebtoken");
const nodemailer=require("nodemailer");
const {google}=require("googleapis");
const {
  uploadToDrive,
  getFileFromDrive,
  deleteFromDrive
} = require("./driveApi.js");
const expressValidator = require('express-validator');
const { v1: uuidv1 } = require('uuid');
const methodOverride = require('method-override')
const fs = require("fs");



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




app.use(express.json());
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); //for serving static files
app.use(express.urlencoded({
  extended: true
})); //for parsing form data
app.use(methodOverride('_method'));
app.use(flash());


app.use(
  session({
    secret: "#sms#",
    resave: true,
    saveUninitialized: true,
  })
);
const CLIENT_ID="465802909834-papgnv7ostf26usmh27gehb3nnt4egjs.apps.googleusercontent.com";
const CLIENT_SECRET="HM0fboBEXtUmqHiT8XDk0NA2";
const REDIRECT_URI="https://developers.google.com/oauthplayground";
const REFRESH_TOKEN="1//04CJnXCsgKx3hCgYIARAAGAQSNgF-L9IrLsnRQYMOsymeaeNpat3xRi2avvUiWxoEwYE-DqB729pQSCr29PNiv_Hvt5kiqbz8xw";
const oAuth2Client=new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})




async function sendMail(receiver, link)
{ 
     try{
        const accessToken=await oAuth2Client.getAccessToken();
        const transport=nodemailer.createTransport({
            service:"gmail",
            auth:{
              type:"OAuth2",
              user:"shubh.gosalia@somaiya.edu",
              clientId:CLIENT_ID,
              clientSecret:CLIENT_SECRET,
              refreshToken:REFRESH_TOKEN,
              accessToken:accessToken
            }
        })
        
        const mailOptions={
          from:"EduConnect <shubh.gosalia@somaiya.edu>",
          to:receiver,
          subject:"EduConnect:Password Reset",
          text:`<p>Kindly Click <a href=${link}>here</a> to reset your password!</p>`,
          html:`<p>Kindly Click <a href=${link}>here</a> to reset your password!</p>`,
        };

        const result=await transport.sendMail(mailOptions)
        return result;

     } catch(error)
     {
        return error;
     }
}

const JWT_SECRET="some super secret.....";


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
app.use(async function (req, res, next) {
  //giving access of loggedIn user to every templates(in views dir)
  res.locals.currentUser = req.user; 
  //giving access of loggedIn user's notifications to every templates(in views dir) (have to populate first though)
  if(req.user){                       
    try {
      const user = await User.findById(req.user._id).populate('notifications').exec() 
      res.locals.notifications = user.notifications.reverse()  //latest notifications first
    } catch (error) {
      console.error(error.message)
    }   
  }
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
//====================middlewares===================================
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("/signup");
  }
  next();
};

const checkReviewExistence = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("/signup");
  }
  Document.findById(req.params.document_id).populate('reviews').exec(function(err, foundDoc){
    if(!foundDoc || err) {
      console.log(err)
      return res.redirect('/results')
    }
    const foundReview = foundDoc.reviews.some(function(review) {
      return review.author.equals(req.user._id)
    })
    if(foundReview){
      req.flash('danger', 'You have already reviewed this document!')
      res.redirect('/single_material/'+req.params.document_id)
    }else if(foundDoc.uploader.id.equals(req.user._id)){
      req.flash('danger', 'You cant review your own document!')
      res.redirect('/single_material/'+req.params.document_id)
    }else{
      next()
    }
  })
}

const isUploader = async(req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("danger", "Please Log In First!");
    return res.redirect("/signup");
  }
  const doc = await Document.findById(req.params.document_id);
  if(!doc.uploader.id.equals(req.user._id)){
    req.flash('danger', 'You do not have permission to do that!');
    return res.redirect('/results');
  }
  next();
}

//====================middlewares===================================

//=======================MULTER=====================================
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },limits: {
    fileSize: 100000000 // max file size 100MB 
  },
});

var upload1 = multer({
  storage: storage1
});

var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/previewPics"))
  },
  filename: function (req, file, cb) {
    cb(null, uuidv1() + path.extname(file.originalname));
  }
})

var upload2 = multer({
  storage: storage2
});

var storage3 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/profilePic"))
  },
  filename: function (req, file, cb) {
    cb(null, uuidv1() + path.extname(file.originalname));
  }
})

var upload3 = multer({
  storage: storage3
});

var file;
app.post("/uploadfile", upload1.single("file"), (req, res, next) => {
  file = req.file;
  // console.log(file);
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  res.send(file);
});


var previewPicIds = [];
app.post("/uploadpics", upload2.single("file"), (req, res, next) => {

  previewPicIds.push(req.file.filename);
  // console.log(file);
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  res.send(file);
});


app.post("/uploadprofile", upload3.single("file"),async (req, res, next) => {

  //profilePicIds.push(req.file.filename);
  try{

  const user = await User.findById(req.user._id)
    console.log(req.file);
  file = req.file;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }

  user.profilePic = req.file.filename;
  user.save();
  req.flash("success","Profile picture is updated");
  return res.redirect('/users/'+user._id);
  }

  catch(error){}

  
});

//============================================================

app.get('/download/:document_id', isLoggedIn,async (req, res) => { 
  
  try {
    const user = await User.findById(req.user._id)
    if(user.points<20) {
      req.flash("danger", "Insufficient points! You need "+(20-user.points)+ "  more points to download this document!");
      return res.redirect('/single_material/'+req.params.document_id)
    }
    const doc = await Document.findById(req.params.document_id);   
    await getFileFromDrive(doc.driveId,doc.fileName)
    setTimeout(function(){ 
      res.download(__dirname +'/downloads/'+doc.fileName);
      user.points -= 20;
      user.save();
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
    // if (uploadedFile) {
    //   console.log(uploadedFile);
    // }
    
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

     req.checkBody("university", "University is required").notEmpty();
     req.checkBody("course", "Course is required").notEmpty();
     req.checkBody("title", "Title is required").notEmpty();
     req.checkBody("category", "Category is required").notEmpty();
     req.checkBody("date", "Date is required").notEmpty();
     req.checkBody("topic", "Topic is required").notEmpty();
     req.checkBody("num_pages", "num_pages is required").notEmpty();
     req.checkBody("description", "description is required").notEmpty();

     let errors = req.validationErrors();
    if (errors) {
      console.log(errors);
      res.render("upload.ejs", {
        errors
      });
    } else{

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
      // console.log(uploadedDoc);
      const foundUser = await User.findById(req.user._id).populate('followers').exec();
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
      previewPicIds=[];

      //creating the notification body
      let newNotification = {
        username : foundUser.username,
        documentId : doc.id
      }
      //pushing the notification into each follower
      let followers = foundUser.followers
      followers.forEach(async(follower) => {
        let notification = await Notification.create(newNotification)
        follower.notifications.push(notification)
        await follower.save()       
      })

      //deleting file from uploads folder
      let pathToFile = path.join(__dirname, "uploads", doc.fileName) 
      //console.log("path: "+pathToFile)          
      fs.unlink(pathToFile, function(err) {
        if (err) {
          throw err
        } else {
          console.log("Successfully deleted the file : " + pathToFile)
        }
      })
    }

    


  } catch (error) {
    console.log(error);
  }
});

app.get("/results", async(req, res) => {

  const docs = await Document.find({})
  if(req.user) {
    const user = await User.findById(req.user._id)
    res.render("results.ejs", {
      docs: docs,
      stared : user.stared
    });
  }else {
    res.render("results.ejs", {
      docs: docs,
    });
  }
  
});


app.post("/search", function(req, res){
  var keyword = req.body.keyword;
  //console.log(keyword);
  //keyword = search.toLowerCase();

  Document.find({$or:[{"university":{ $regex : new RegExp(keyword, "i") }},
                      {"course": { $regex : new RegExp(keyword, "i") }},
                      {"title": { $regex : new RegExp(keyword, "i") }},
                      {"topic": { $regex : new RegExp(keyword, "i") }}
                      ]},
                      function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.render("results.ejs", {
        docs: docs

      });
    }
  });
});

app.post("/filter", function(req, res){
    var university = req.body.university;
    var course = req.body.course;
    var topic = req.body.topic;
    var category = req.body.category;
    console.log(university, course, topic, category);

 Document.find({"university":{ $regex : new RegExp(university, "i") },
                      "course": { $regex : new RegExp(course, "i") },
                      "topic": { $regex : new RegExp(topic, "i") },
                      "category": { $regex : new RegExp(category, "i") }
                      },
                      function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      req.flash("success","Filter has been added. ");
      res.render("results.ejs", {
        docs: docs

      });
    }
  });

});

app.get("/users/:user_id/stared", isLoggedIn, async(req, res)=>{
    try{
      const user = await User.findById(req.user._id).populate("stared")     
       res.render("stared.ejs", {
            docs: user.stared
          });          
    } catch(error){
      console.log(error)
    }
});


app.post("/results/:document_id/addstar",  isLoggedIn, async(req, res) => {
  try{
     const user = await User.findById(req.user._id);  
     const foundDoc = await Document.findById(req.params.document_id);     
     user.stared.push(foundDoc);
     user.save();
     req.flash('success', 'Document added to starred documents.')
     return res.redirect("/results");

  } catch(error){
      console.error(error);
      return redirect("/results")
  }
});

app.post("/results/:document_id/removestar",  isLoggedIn, async(req, res) => {
  try{
     const user = await User.findById(req.user._id);  

     //removing the stared document from the user.stared array
     let i = 0;
     while(i < user.stared.length){
       if(user.stared[i]==req.params.document_id){
         break;
       }
       i++;
     }
     if (i > -1) {
       user.stared.splice(i, 1);
     }
     user.save();
     req.flash('success', 'Document removed from starred documents.')
     return res.redirect("back");
  } catch(error){
      console.error(error);
      return redirect("/results")
  }
});

app.post('/single_material/:document_id/reviews', isLoggedIn, checkReviewExistence, async (req, res) => {
  const upvote = (req.body.upDown == 'upvote') ? true : false;
  const review = new Review({
    upvote: upvote,
    text: req.body.text,
    author: req.user._id
  })

  const foundDoc = await Document.findById(req.params.document_id);
  const docOwner = await User.findById(foundDoc.uploader.id);
  if(review.upvote){
      console.log("upvote done");
      foundDoc.upvotes++; 
      docOwner.upvotes++;
  }
  else{
      console.log("downvote done");
      foundDoc.downvotes++;
  }
  foundDoc.reviews.push(review);
  foundDoc.save();

  
  

  const user = await User.findById(req.user._id);
  user.points += 5;

  await review.save();
  await foundDoc.save();
  await user.save();
  await docOwner.save();

  console.log(review)
  
  req.flash('success', 'Review submitted successfully. You earned 5 points!');
  res.redirect("/single_material/"+req.params.document_id);

})

app.get("/upload", isLoggedIn, (req, res) => {
  res.render("upload.ejs", {
    courses
  });
});

app.get("/users/:user_id", async (req, res) => {
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
            docs: docs,
            user : foundUser
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

app.delete('/single_material/:document_id', isLoggedIn, isUploader, async(req, res) => {

  const doc = await Document.findByIdAndDelete(req.params.document_id); //delete document from mongoDB
  deleteFromDrive(doc.driveId) //delete document from drive
  await Review.deleteMany({ _id : {$in : doc.reviews} }) //delete all reviews of the document

  //deleting file's previewPics
  for(let i = 0 ; i < doc.previewPics.length;i++){
    const pathToFile = path.join(__dirname, "public/previewPics", doc.previewPics[i])
    console.log("path : "+pathToFile)
    fs.unlink(pathToFile, function(err) {
     if (err) {
        throw err
     } else {
        console.log("Successfully deleted the file : " + pathToFile)
      }
    })    
  }
  
  req.flash('success', 'Successfully deleted Document.')
  res.redirect('/results');
})

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

//forgot and reset password
app.get("/forgot-password",(req,res) =>{
      res.render("forgot-password");
});

app.post("/forgot-password",(req,res) => {
      (async()  => {
        const{email}=req.body;
        try{
          let foundUser=await User.findOne({username : email});      
          if(foundUser){
            const secret=JWT_SECRET;
            const payload = {
              email : foundUser.username
            }
            const token=jwt.sign(payload,secret,{expiresIn:'15m'});
            const link=`http://localhost:3000/reset-password/${token}`;
            req.flash("success","Password reset link sent!")
            console.log(link);          
            sendMail(email,link).then(result=>console.log("Email sent....",result));
            res.redirect("/signup");
          }else{
            req.flash("danger","That email id is not registered!")
            return res.redirect("/signup");
          }
        }
        catch(error){
          console.log(error)
        }          
    })();
});

app.get("/reset-password/:token", async(req,res) =>{  
  const{token}=req.params;
  try{
    const secret=JWT_SECRET;
    const payload = jwt.verify(token,secret);      
    const foundUser = await User.findOne({username : payload.email})
    if(!foundUser) {
      req.flash('danger', 'User not found!')
      return res.redirect('/signup')
    }  
    res.render("reset-password.ejs", {token});
  }
  catch(error)
  {
    console.log(error.message);
    res.send(error.message);
  }
});

app.post("/reset-password/:token",(req,res) =>{
  (async()  => {
    const{token}=req.params;
    try {
      const secret=JWT_SECRET;
      const payload = jwt.verify(token,secret);
      const foundUser = await User.findOne({username : payload.email })
      if(!foundUser) {
        req.flash('danger', 'User not found!')
        return res.redirect('/signup')
      }
          
    const{new_password,confirm_password}=req.body;       
    if(new_password.length > 0 && new_password === confirm_password){
      
        await foundUser.setPassword(new_password)
        await foundUser.save()
        req.flash("success","Password has been reset successfully!");
        res.redirect("/signup");
     
    }else{
      req.flash("danger","Oops! Passwords do not match!");
      return res.redirect("back");
    }
  }catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
  })();
});

//follow a user
app.get('/users/:userId/follow', isLoggedIn, async(req,res) => {
  const user = await User.findById(req.params.userId)
  console.log(user)
  if(!user){
    req.flash('danger', 'User not found!')
    return res.redirect('/results')
  }  
  user.followers.push(req.user._id)
  user.followerCount++
  req.flash('success', 'You started following '+ user.fullname +'.' )
  user.save()
  
  res.redirect('back')
})

//unfollow a user
app.get('/users/:userId/unfollow', isLoggedIn, async(req,res) => {
  const user = await User.findById(req.params.userId)
  console.log(user)
  if(!user){
    req.flash('danger', 'User not found!')
    return res.redirect('/results')
  }  
  let i = 0;
     while(i < user.followers.length){
       if(user.followers[i].equals(req.user._id)){
         break;
       }
       i++;
     }
     if (i > -1) {
       user.followers.splice(i, 1);
     }
  user.followerCount--
  user.save()
  req.flash('success', `You unfollowed ${user.fullname}.`)
  res.redirect('back')
})

// delete notification if it has been read(clicked)
app.get('/notification/:notificationId', isLoggedIn, async(req, res) => {
  try {
    const user = await User.findById(req.user._id)
    let noti = await Notification.findByIdAndDelete(req.params.notificationId)  
    let i = 0;
    while(i < user.notifications.length){
      if(user.notifications[i].equals(req.params.notificationId)){
        break;
      }
      i++;
    }
    if (i > -1) {
      user.notifications.splice(i, 1);
    }
    user.save()  
    return res.redirect(`/single_material/${noti.documentId}`)    
  } catch (error) {
    console.log(error.message)
  }  
})

const port = 3000;

app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});