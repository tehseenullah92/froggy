var express = require('express');
var router = express.Router();
const authorized = require('../middleware/authorized')
let User = require('../models/user');
router.get('*', authorized, function(req,res,next){
  res.locals.user = req.user || null;
  next();
});

app.get('/', authorized, function (req, res) {
  res.render('dashboard',{ message : ('Welcome to dashboard'), title:('Admin | Dashboard')})
})
app.get('/dashboard', authorized, function (req, res) {
  res.render('dashboard',{ message : ('Welcome to dashboard'), title:('Admin | Dashboard')})
})

module.exports = router;
