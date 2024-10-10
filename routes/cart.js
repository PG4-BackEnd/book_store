const express = require("express");

const shopController = require("../controllers/cart");

const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/cart", isAuth, shopController.getCart);

router.post("/cart", isAuth, shopController.postCart);

router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct);
