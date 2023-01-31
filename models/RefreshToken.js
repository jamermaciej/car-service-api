const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");

const RefreshTokenSchema =  mongoose.Schema({
    token: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    expiryDate: Date
});

RefreshTokenSchema.statics.createToken = async function(user) {
    let expiredAt = new Date();

    expiredAt.setSeconds(
        expiredAt.getSeconds() + 10000
    );

    const token = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN_KEY,
        {
            expiresIn: "1d",
        }
    );

    const refreshToken = await this.create({
        token,
        user: user._id,
        expiryDate: expiredAt.getTime()
    });

    return refreshToken.token;
}

RefreshTokenSchema.statics.verifyExpiration = async function(token) {
    return token.expiryDate.getTime() < new Date().getTime();
}

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);