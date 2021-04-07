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
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  num_pages: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  reports:{
     type:Number,
     default:0,
  },
  reported:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"

  }],
 
  driveId : String,
  mimeType : String,
  fileName : String, 
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