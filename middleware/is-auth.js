module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
    //return res.status(401).redirect("/login"); //401되도 redirect에 의해 300으로감
  }
  next();
};
