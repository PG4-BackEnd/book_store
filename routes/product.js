const express = require("express");

const productController = require("../controllers/product");

const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", productController.getProducts);

router.get("/:productId", productController.getProduct);

module.exports = router;
