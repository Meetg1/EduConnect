const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  university: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  uploads: {
    type: Number,
    default: 0,
  },
  notes_uploads: {
    type: Number,
    default: 0,
  },
  assignments_uploads: {
    type: Number,
    default: 0,
  },
  papers_uploads: {
    type: Number,
    default: 0,
  },
  followerCount: {
    type: Number,
    default: 0,
  },
  followers : [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  notifications : [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notification"
  }],
  profilePic :{ 
    type: String,
    default: "stockPhoto.jpg"
  }, 
  usernameToken:String,
  isVerified:{
    type: Boolean,
    default: false
  },
  isBanned:{
    type: Boolean,
    default: false
  },
  stared : [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document"
  }],
  reports : {
    type: Number,
    default: 0
  }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
