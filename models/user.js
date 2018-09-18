const mongoose = require('mongoose');
const passportlocalmongoose=require("passport-local-mongoose");
const keySecret = process.env.SECRET_KEY;
const keyPublishable = process.env.PUBLISHABLE_KEY;
const bCrypt = require('bcryptjs');
const async    = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendVerificationEmail = require('../lib/sendVerificationEmail');
const UserSchema = mongoose.Schema({
  name:{
    type: String,
  },
  email:{
    type: String,
    required: true
  },
  username:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  googleId: String,
  linkedinId:String,
  resetPasswordToken:String,
  resetPasswordExpires:String,
  verify:String,
  emailverificationtoken:String,
  emailverificationtokenexpire:String,

});
// Pre Statement

UserSchema.pre('save', function(next) {
  var newEmail = this.email;
  const setVerification = () => {
    const tokenHash = new Date().toISOString()
    const hash = crypto.createHmac('sha256', 'emailverificationtoken').update(tokenHash).digest('hex');
    this.verify = false;
    this.emailverificationtoken = hash;
    this.emailverificationtokenexpire = Date.now() + 3600000;
    this._sendEmail = true
  }
  if (this.isNew) {
    setVerification()
    next();
    return
  }
  User.findById(this._id, (err, user) => {
    if(err) {
      console.log(error);
      return
    }
    var oldEmail = user.email;
    if(oldEmail != newEmail){
      setVerification()
    }
    next();
  });
});
UserSchema.post('save', function(user) {
  if(this._sendEmail) {
    sendVerificationEmail(this.emailverificationtoken, this.email);
  }
})
UserSchema.plugin(passportlocalmongoose);
const User = module.exports = mongoose.model('User', UserSchema);
