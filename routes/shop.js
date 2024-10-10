const express = require("express");

const shopController = require("../controllers/shop");

const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/shop", shopController.getIndex);

//postOrder대신 getCheckoutSuccess
router.get("/checkout", isAuth, shopController.getCheckout);

router.get("/checkout/success", shopController.getCheckoutSuccess);

router.get("/checkout/cancel", shopController.getCheckout);

router.post("/create-order", isAuth, shopController.postOrder);

router.get("/orders", isAuth, shopController.getOrders);

router.get("/orders/:orderId", isAuth, shopController.getInvoice);

module.exports = router;
