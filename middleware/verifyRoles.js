const User = require("../models/User");
const config = process.env;

const verifyRoles = (roles) => {
    return (req, res, next) => {
        if (!req?.user?.roles) return res.status(401).json({ message: 'Unauthorized' });

        const isAllowed = req.user.roles.map(role => roles.includes(role)).find(val => val === true)

        if (!isAllowed) return res.status(401).json({ message: 'Unauthorized' });

        next();
    }
}

module.exports = verifyRoles;