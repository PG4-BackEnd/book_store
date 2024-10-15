const express = require("express");

const cartController = require("../controllers/cart");

const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", isAuth, cartController.getCart);

router.post("/", isAuth, cartController.postCart);

router.post("/item", isAuth, cartController.postCartDeleteProduct);

module.exports = router;
