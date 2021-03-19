const mongoose = require("mongoose");

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
  date: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  num_pages: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  driveId : {
    type : String,
    required : true,
  },
  previewPics : [String],
  uploader : {                                            
    id : {
      type: mongoose.Schema.Types.ObjectId,
      ref : 'User'
    },
    username : String
  },
  reviews : [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Review"
  }]
});

module.exports = mongoose.model("Document", DocumentSchema);