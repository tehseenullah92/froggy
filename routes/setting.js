// const keySecret = process.env.SECRET_KEY;
const keyPublishable = process.env.PUBLISHABLE_KEY;
const express = require('express');
const router = express.Router();
const bCrypt = require('bcryptjs');
// const stripe = require("stripe")(keySecret);
const async    = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const authorized = require('../middleware/authorized')
let User = require('../models/user');
router.get('*', authorized, function(req,res,next){
  res.locals.user = req.user || null;
  next();
});
router.get('/',  (req, res, next) => {
  res.render('setting',{ message: req.flash('message'), title: ('Account Setting')});
})
// list all users
router.get('/users', (req, res) => {
  User.find({}, function(err, Users){
    if (err)
        return done(err);

    if (Users) {
      console.log("Users count : " + Users.length);
      res.render('users', {
        usersArray: Users,
        message: req.flash('message'),
        title: ('List All Users'),
      });
    }
  });
  // res.render('users', { message: req.flash('message'), title: ('List All Users') });
});


var isValidPassword = function(user, password){
  return bCrypt.compareSync(password, user.password);
}
var createHash = function(password){
  return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}
function updateinfo(req, res){
  console.log(req.body);false;
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  let errors = req.validationErrors();
  if(errors){
    errors = errors.map(errors => errors.msg)
    req.flash('message',errors);
    res.redirect('/setting');
    return;
  }
  var request = req.body;
  var user    = req.user;
  user.name   = request.name;
  user.email  = request.email;
  user.save(function(err, u){
    if(err){
      console.log('Error in Update Account setting: '+err);
      throw err;
    }
    req.flash('message', 'Please check your email for verification');
    res.redirect('/setting');
    return;
  });
}
function updatepassword(req, res){
  const user = req.user;
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('newpassword', 'New Password is required').notEmpty();
  let errors = req.validationErrors();
  if(errors){
    errors = errors.map(errors => errors.msg)
    req.flash('message',errors);
    res.redirect('/setting');
  }
  var request = req.body;
  if(isValidPassword(user, request.password)){
    user.password = createHash(request.newpassword);
  } else {
    req.flash('message', 'Invalid Password');
    res.redirect('/setting');
    return
  }
  user.save(function(err){
    if(err){
      console.log('Error in Update Account setting: ', err);
      throw err;
    }
    req.flash('message', 'Password Updated');
    res.redirect('/setting');
  });
}
router.post('/updateinfo', (req, res, next) => {
  updateinfo(req, res);
})
router.post('/updatepassword', (req, res, next) => {
    updatepassword(req, res);
})
router.post('/', (req, res, next) => {
  const user = req.user;
  const request = req.body;
  let errors = []
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  if(req.body.password){
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('newpassword', 'New Password is required').notEmpty();
    req.checkBody('cnewpassword', 'Confirm New Password is required').notEmpty();
    req.checkBody('newpassword', 'Password must be greater than 6').isLength({ min: 6 });
    req.checkBody('cnewpassword', 'Password must be greater than 6').isLength({ min: 6 });
    if(request.newpassword !== request.cnewpassword){
        errors.push({
          param: 'newpassword',
          msg: 'New Password & Confirm New Password Not Matched',
          value: request.newpassword
        })
    }
    if(!isValidPassword(user, request.password)){
      errors.push({
        param: 'password',
        msg: 'Password did not match',
        value: request.password
      })
    }
  }
  const validationErrors = req.validationErrors()
  if(validationErrors) {
    errors = errors.concat(validationErrors);
  }
  if(errors && errors.length){
    errors = errors.map(errors => errors.msg)
    req.flash('message',errors);
    res.redirect('/setting');
    return;
  }
  if(request.password) {
    user.password = createHash(request.newpassword);
  }
  user.name   = request.name;
  var emailChanged = false
  if(user.email !== request.email) {
    emailChanged = true
    user.email  = request.email;
  }
  user.save(function(err){
    if(err){
      console.error('Error in Update Account setting: '+err);
    }
    if(emailChanged) {
      req.flash('message', 'Please check your email for verification');
    }
    req.flash('message', 'Account setting Updated');
    res.redirect('/setting');
  });
})

module.exports = router
