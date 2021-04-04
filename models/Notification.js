const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    documentId: String
});

module.exports = mongoose.model("Notification", NotificationSchema);