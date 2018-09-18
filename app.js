require('dotenv').config()
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const session = require('express-session');
const passport = require('passport');
const _ = require('lodash');
const json2csv = require('json2csv');
const authorized = require('./middleware/authorized');
const flash = require('connect-flash');
const rp = require('request-promise-native');

require('./config/passport')(passport);
const users = require ('./routes/users');
const setting = require ('./routes/setting');

var app = express();
let User = require('./models/user');
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(flash());
// app.use(session({
//   secret: 'secret',
// }));

const mongoose = require('mongoose');
const config = require ('./config/database');

mongoose.Promise = require('bluebird')
mongoose.connect(config.database, { useMongoClient: true });
let db = mongoose.connection;

db.once('open', function(){
  console.log('Connected to MongoDB');
})
db.on('error', function(err){
  console.log(err);
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.')
    , root    = namespace.shift()
    , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.get('/', authorized, function (req, res) {
  res.render('dashboard',{ message: req.flash('message'), title: ('Welcome To Dashboard') })
})
app.use('/users', users);
app.use('/setting', setting);

app.get('*', authorized, function(req, res, next){
  res.locals.user = req.user || null;
  next();
})

// accuweather API start from here...
const configs = {
  apikey: "ORgYqevm4owGUsfXdDIZm43sDjl3Exk8",
  language: "en-us",
  details:true
};
const accuweatherSimple = require("./index")(configs);

accuweatherSimple.getWeather("santiago").then(result => console.log(result));


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
