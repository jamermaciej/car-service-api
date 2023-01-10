const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcryptjs");

module.exports = Roles = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
    CUSTOMER: 'Customer'
}

const UserSchema =  mongoose.Schema({
    name: {
        type: String,
        // required: ["Please tell us your name!"],
        default: null
    },
    email: {
        type: String,
        required: ["Please provide your email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email"]
    },
    password: { 
        type: String,
        required: [true, "Please provide a password"],
        minlength: 8
    },
    passwordConfirm: { 
        type: String,
        required: [true, "Please confirm your password"],
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: "Passwords are not the same"
        }
    },
    roles: {
        type: [String],
        enum: Object.values(Roles),
        default: Roles.EMPLOYEE
    },
    phoneNumber: {
        type: String
    },
    photo: {
        type: String
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    created_at: { 
        type: Date,
        required: true,
        default: Date.now()
    },
    last_login_at: {
        type: Date,
        default: Date.now()
    },
});

UserSchema.pre('save', async function(next){
    if (!this.isModified('password')) return next();
    
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

UserSchema.methods.correctPassword = async function(condidatePassword, userPassword) {
    return await bcrypt.compare(condidatePassword, userPassword);
}

module.exports = mongoose.model('User', UserSchema);