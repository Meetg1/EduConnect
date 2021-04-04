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
  followers: {
    type: Number,
    default: 0,
  }, 
  profilePic : String,
  username:String,
  usernameToken:String,
  isVerified:Boolean,
  stared : [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document"
  }]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
