const express = require("express");

const ordercontroller = require("../controllers/order");

const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post("/", isAuth, ordercontroller.postOrder);

router.get("/", isAuth, ordercontroller.getOrders);

router.get("/:orderId", isAuth, ordercontroller.getInvoice);

module.exports = router;
