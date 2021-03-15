const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const DocumentSchema = new mongoose.Schema({
  university: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  pages: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  }  
});

module.exports = mongoose.model("Document", DocumentSchema);
