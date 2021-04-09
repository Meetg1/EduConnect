const mongoose = require('mongoose')

const StatSchema = new mongoose.Schema({
    id: Number,
    totalUsers: {
        type: Number,
        default: 0
    },
    totalDocuments: {
        type: Number,
        default: 0
    },
    totalDownloads: {
        type: Number,
        default: 0
    },
    totalReports: {
        type: Number,
        default: 0
    },
    pointsEarned: {
        type: Number,
        default: 0
    },
    pointsSpent: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("Stat", StatSchema);