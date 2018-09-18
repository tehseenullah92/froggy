module.exports = (req, res, next) => {
  if (!req.user) {
    res.redirect('/users/login')
    return
  }
  next()
}
