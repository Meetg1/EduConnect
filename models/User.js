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
  profilePhoto: {
    type: String,
    default:
      "https://image.shutterstock.com/image-vector/profile-picture-vector-600w-404138239.jpg",
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
  followers: {
    type: Number,
    default: 0,
  },
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
