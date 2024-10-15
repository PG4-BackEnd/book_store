const express = require("express");

const checkoutController = require("../controllers/checkout");

const isAuth = require("../middleware/is-auth");

const router = express.Router();

//postOrder대신 getCheckoutSuccess
router.get("/", isAuth, checkoutController.getCheckout);

router.get("/success", checkoutController.getCheckoutSuccess);

router.get("/cancel", checkoutController.getCheckout);

module.exports = router;
