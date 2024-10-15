const express = require("express");

const router = express.Router();

router.get("/", [], (req, res, next) => {
  res.render("main", {
    pageTitle: "Main",
    path: "/",
  });
});
module.exports = router;
