const express = require('express');
const router = express.Router();
const bcrypt = require ('bcryptjs');
const passport = require('passport');
const crypto = require('crypto');
const bCrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const xoauth2 =  require('xoauth2');
const smtpTransports = require('nodemailer-smtp-transport');
const async    = require('async');
const keySecret = process.env.SECRET_KEY;
const authorized = require('../middleware/authorized');
const SMTP_USER=process.env.SMTP_USER;
const SMTP_PASS=process.env.SMTP_PASS;
const SMTP_HOST=process.env.SMTP_HOST;

let User = require('../models/user');

var isValidPassword = function(user, password){
  return bCrypt.compareSync(password, user.password);
}
var createHash = function(password){
  return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

var smtpTransport = nodemailer.createTransport(smtpTransports( {
  host:SMTP_HOST,
  secureConnection: false,
  port:587,
  secure:false,
  requiresAuth: true,
  domains: ["gmail.com", "googlemail.com"],
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  }
}));

router.get('/forgot', (req, res) => {
  res.render('forgot', { message: req.flash('message'), title:('Forgot Password') });
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('message', 'No Account with that email address exists.');
          return res.redirect('/users/forgot');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {

      var mailOptions = {
        to: user.email,
        from: SMTP_USER,
        subject: 'Froggy App password reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your Account setting.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('message', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/forgot');
  });
});
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('message', 'Password reset token is invalid or has expired.');
      return res.redirect('/users/forgot');
    }
    res.render('reset', {
      user: req.user,message: req.flash('message') });
  });
});

router.post('/reset/:token', function(req, res) {

  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('message', 'Password reset token is invalid or has expired.');
          done('Password reset token is invalid or has expired.')
          return
        }
        req.checkBody('password', 'Password is required').notEmpty();
        req.checkBody('password', 'Password must be greater than 6').isLength({ min: 6 });
        let errors = req.validationErrors();
        if(errors){
          errors = errors.map(errors => errors.msg)
          req.flash('message',errors);
          return done(errors);
        }
        user.password = createHash(req.body.password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var mailOptions = {
        to: user.email,
        from: SMTP_USER,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your Account setting ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('message', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    if(err){
      res.redirect('/users/reset/'+req.params.token);
      return;
    }
    res.redirect('/');
  });
});
router.get('/verify/:token', function(req, res, done) {
      User.findOne({emailverificationtoken: req.params.token, emailverificationtokenexpire: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('message', 'verify token is invalid or has expired.');
          res.redirect('/setting');
        }
        user.verify = true;
        user.emailverificationtoken = null;
        user.emailverificationtokenexpire = null;
        user.save(function(err) {
            req.flash('message', 'Your setting has been verified, please login to continue')
            res.redirect('/');
        });
      });
});

router.get('/register', (req, res) => {
  res.render('register', { message: req.flash('message'), title: ('Register') });
});

router.post('/register', passport.authenticate('register', {
  successRedirect: '/',
  failureRedirect: '/users/register',
  failureFlash : true
}));

router.get('/login',  (req, res, next) => {
  res.render('login',  { message: req.flash('message'), title: ('Login') });
})

router.post('/login', passport.authenticate('login', {
  successRedirect: '/',
  failureRedirect: '/users/login',
  failureFlash : true
}));

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router
