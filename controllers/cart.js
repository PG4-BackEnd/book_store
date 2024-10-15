const Product = require("../models/product");

const handleServerError = (err, next) => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
};
exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    //.execPopulate() // execPopulate()는 populate() 메서드가 반환하는 쿼리 객체를 실행하여 Promise를 반환
    .then((user) => {
      // console.log("items111", user.cart.items);
      // if(user.cart.items.productId ===null){}
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      //      console.log(err);
      handleServerError(err, next);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      //   console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      //      console.log(err);
      handleServerError(err, next);
    });
  /*
    let fetchedCart;
    let newQuantity = 1;
    req.user
      .getCart()
      .then((cart) => {
        fetchedCart = cart;
        return cart.getProducts({ where: { id: prodId } });
      })
      .then((products) => {
        let product;
        if (products.length > 0) {
          product = products[0];
        }
  
        if (product) {
          const oldQuantity = product.cartItem.quantity;
          newQuantity = oldQuantity + 1;
          return product;
        }
        return Product.findById(prodId);
      })
      .then((product) => {
        return fetchedCart.addProduct(product, {
          through: { quantity: newQuantity },
        });
      })
      .then(() => {
        res.redirect("/cart");
      })
      .catch((err) => console.log(err));
      */
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};
