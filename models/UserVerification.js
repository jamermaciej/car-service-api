const mongoose = require('mongoose');

const UserVerificationSchema =  mongoose.Schema({
    userId: {
        type: String
    },
    uniqueString: {
        type: String,
    },
    createdAt: {
        type: Date,
    },
    expiresAt: {
        type: Date,
    }
});

module.exports = mongoose.model('UserVerification', UserVerificationSchema);