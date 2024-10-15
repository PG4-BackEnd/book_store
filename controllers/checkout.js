const Product = require("../models/product");
const Order = require("../models/order");
const { private_stripe_key } = require("../config/prod");

//여기서는 private secret key를 사용해줘야함
const stripe = require("stripe")(private_stripe_key);

const handleServerError = (err, next) => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  //populate 메서드는 Mongoose에서 제공하는 기능으로, 참조된 다른 문서의 실제 데이터를 조회해 오는 데 사용
  //populate에 의해 단순 제품아이디가 아니라 제품 데이터이다
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      total = 0;
      products.forEach((p) => {
        // console.log(p.productId.title);
        total += p.quantity * p.productId.price;
      });
      //ejs에 세션키가 있어야 해서 여기서 세션키를 생성해준다
      //session에 구성해야하는거
      return stripe.checkout.sessions.create({
        //신용카드결제가 가능한 카드, 배열이다
        payment_method_types: ["card"],
        //어떤 항목을  계산할지 지정, map으로 새배열
        // line_items: products.map((p) => {
        //   return {
        //     name: p.productId.title,
        //     description: p.productId.description,
        //     //cent로 표현해서 100곱함
        //     amount: p.productId.price * 100,
        //     //달러는 usd달러
        //     currency: "usd",
        //     quantity: p.quantity,
        //   };
        // }),

        line_items: products.map((p) => {
          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: p.productId.title,
                description: p.productId.description,
              },
              unit_amount: p.productId.price * 100, // cent로 표현해서 100 곱함
            },
            quantity: p.quantity,
          };
        }),
        // Checkout 세션의 모드를 설정
        mode: "payment",
        //거래 성공/실패 url 로 redirect
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success", // http://localhost:3000/checkout/success
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel", // http://localhost:3000/checkout/cancel
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        products: products,
        pageTitle: "Checkout",
        path: "/checkout",
        totalSum: total,
        sessionId: session.id,
      });
    });
};
//postorder의 역할
exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    //.execPopulate() // execPopulate()는 populate() 메서드가 반환하는 쿼리 객체를 실행하여 Promise를 반환
    .then((user) => {
      console.log(user.cart.items);
      //user.cart.items는 productId와 quantity 둘다있다
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, productData: { ...i.productId._doc } };
        //: 전개 연산자(...)를 사용하여 _doc 속성의 모든 필드를 productData 객체로 복사
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      //      console.log(err);
      handleServerError(err, next);
    });
};
