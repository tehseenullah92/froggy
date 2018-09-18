const LocalStrategy = require ('passport-local').Strategy;
const User = require('../models/user');
const config = require('../config/database');
const bCrypt = require('bcryptjs');


module.exports = function (passport){
  var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
  }
  var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  }
  passport.use('login', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) {
    User.findOne({ 'username':  username },
    function(err, user) {
      if (err)
      return done(err);
      if (!user){
        return done(null, false,
          req.flash('message', 'User Not found.'));
        }
        if (!isValidPassword(user, password)){
          return done(null, false,
            req.flash('message', 'Invalid Password'));
          }
          return done(null, user);
        }
      );
    }));
    passport.use('register', new LocalStrategy({
      passReqToCallback : true
    },
    function(req, username, password, done) {
      // console.log(req);false;
      findOrCreateUser = function(){
        User.findOne({'username': username},function(err, user) {
          if (err){
            return done(err);
          }
          if (user) {
            return done(null, false,
              req.flash('message','User Already Exists'));
            } else {
              req.checkBody('name', 'Name is required').notEmpty();
              req.checkBody('email', 'Email is required').notEmpty();
              req.checkBody('email', 'Email is not valid').isEmail();
              req.checkBody('username', 'Username is required').notEmpty();
              req.checkBody('password', 'Password is required').notEmpty();
              let errors = req.validationErrors();
              if (errors){
                errors = errors.map(error => error.msg)
                return done(null, false,
                  req.flash('message',errors));
              }
              var request = req.body;

              var newUser = new User();
              newUser.username = username;
              newUser.password = createHash(password);
              newUser.email = request.email;
              newUser.name = request.name;
              newUser.save(function(err) {
                if (err){
                  console.log('Error in Saving user: '+err);
                  throw err;
                }
                return done(null, newUser);
              });
            }
          });
        };
        process.nextTick(findOrCreateUser);
      })
    );

    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      User.findById(id, function(err, user) {
        done(err, user);
      });
    });

  };
