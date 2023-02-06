const User = require("../models/User");

const handleLogout = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.sendStatus(401);
    }

    const user = await User.findOne({ refreshToken });

    if (!user) {
        res.clearCookie('refreshToken', { sameSite: 'None', httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 });
        res.sendStatus(204);
    }

    // await User.findByIdAndUpdate(user._id, { '$unset' : { refreshToken: 1 }});
    const newRefreshTokens = user.refreshToken.filter(rt => rt !== refreshToken);
    await User.findOneAndUpdate({ _id: user._id }, { refreshToken: newRefreshTokens });
    res.clearCookie('refreshToken', { sameSite: 'None', httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 });
    res.sendStatus(204);
}

module.exports = { handleLogout };