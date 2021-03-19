const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    upvote: {               // considering upvote if true and downvote if false
        type: Boolean,
        default: true
    },
    text: {
        type: String,
        required: true
    },
    author: {    
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User'                 
    }
}, {
    // if timestamps are set to true, mongoose assigns createdAt and updatedAt fields to your schema, the type assigned is Date.
    timestamps: true
});


module.exports = mongoose.model("Review", ReviewSchema);