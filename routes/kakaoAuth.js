const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/is-auth");

const kakaoauthcontroller = require("../controllers/kakaoauth");

router.get("/authorize", kakaoauthcontroller.authorize);

router.get("/redirect", kakaoauthcontroller.redirect);

router.get("/profile", isAuth, kakaoauthcontroller.profile);

router.get("/message", isAuth, kakaoauthcontroller.getMessage);

router.post("/message", isAuth, kakaoauthcontroller.postMessage);

router.post("/logout", isAuth, kakaoauthcontroller.logout);

module.exports = router;
