const Product = require("../models/product");
const Order = require("../models/order");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
//여기서는 private secret key를 사용해줘야함
const stripe = require("stripe")(
  "sk_test_51Pd29N2MR0X41DzarcqlBngRnn5BfiWHbuNxz5G1RSG5P9PkSspmnLzyv6wx8YoKNbugyojIbmBaNTHbIt5qIBju00wcMUGUjC"
);

const ITEMS_PER_PAGE = 2;

const handleServerError = (err, next) => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
};

exports.getProducts = (req, res, next) => {
  //+는 단항 덧셈 연산자 ,문자열을 숫자로 바꿔줌
  //||는 둘중하나가 참이면 true반환
  //url에 ?page=2처럼 적혀있음
  const page = +req.query.page || 1;
  let totalItems;

  //documents의 개수가 product의 개수
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE) //2페이지라면 1페이지 넘김, 3페이지라면 1,2페이지넘김
        .limit(ITEMS_PER_PAGE);
    })

    //Product.find()의 결과가 배열임

    //mongodb driver에서 사용하던 find메서드 : cursor대신 products줌
    // Product.fetchAll()
    .then((products) => {
      // console.log(products);
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems, //각 페이지에서 가능 아이템개수 * 전체 page수가 전체아이템개수 보다 크거나 같으면 다음 페이지가 없는거
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      //console.log(err);
      handleServerError(err, next);
    });
};

exports.getProduct = (req, res, next) => {
  //url에 있는 파라미터로 productId를 전달했다
  const prodId = req.params.productId;
  console.log(prodId);
  // Product.findAll({ where: { id: prodId } })
  //   .then(products => {
  //     res.render('shop/product-detail', {
  //       product: products[0],
  //       pageTitle: products[0].title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));

  //Mongoose에 findById 메서드 빌트인이다
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      //   console.log(err);
      handleServerError(err, next);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  //documents의 개수가 product의 개수
  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE) //2페이지라면 1페이지 넘김, 3페이지라면 1,2페이지넘김
        .limit(ITEMS_PER_PAGE);
    })

    //Product.fetchAll()
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      //      console.log(err);
      handleServerError(err, next);
    });
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
      console.log(result);
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
        //: 전개 연산자(...)를 사용하여 _doc 속성의 모든 필드를 productData 객체로 복사합니다.
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

//ctrl d 하면 모두선택
exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    //.execPopulate() // execPopulate()는 populate() 메서드가 반환하는 쿼리 객체를 실행하여 Promise를 반환
    .then((user) => {
      console.log(user.cart.items);
      //user.cart.items는 productId와 quantity 둘다있다
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, productData: { ...i.productId._doc } };
        //: 전개 연산자(...)를 사용하여 _doc 속성의 모든 필드를 productData 객체로 복사합니다.
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

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      //  console.log(err);
      handleServerError(err, next);
    });
};

exports.getInvoice = (req, res, next) => {
  //orderid 체크
  //url에 orderid전달했음
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      // })
      // .catch((err) => {
      //   next(err);
      // });
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      //읽을수있는 스트림이다
      const pdfDoc = new PDFDocument();
      //Content-Type 헤더를 application/pdf로 설정하여 클라이언트에게 반환되는 데이터가 PDF 파일임을 알림
      res.setHeader("Content-Type", "application/pdf");
      //Content-Disposition 헤더를 inline; filename="invoiceName"으로 설정하여 브라우저가 PDF 파일을 인라인으로 표시하도록 하고,
      // 파일 이름을 invoiceName으로 지정

      //HTTP 응답 헤더의 Content-Disposition 필드에서 inline 값을 사용하면, 브라우저는 해당 파일을 다운로드하지 않고,
      //브라우저 내에서 바로 표시(미리보기)하려고 시도. 반면, attachment 값을 사용하면 브라우저는 해당 파일을 다운로드하도록 합니다.
      res.setHeader(
        "Content-Disposition",
        'inline; filename ="' + invoiceName + '""'
      );
      //pipe는 Node.js에서 스트림(Stream)을 다룰 때 사용되는 메서드
      //스트림은 데이터의 흐름을 나타내며, 파일 읽기/쓰기, 네트워크 통신 등에서 데이터를 조작할 때 유용하게 사용
      //pipe 메서드는 한 스트림에서 다른 스트림으로 데이터를 전송하도록 도와주는 메커니즘
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      // PDF 문서 객체를 HTTP 응답 스트림 res에도 연결하여 클라이언트에 전송
      pdfDoc.pipe(res);
      //쓰기
      // pdfDoc.text("hello world");
      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("--------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.productData.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.productData.title +
              "-" +
              prod.quantity +
              "x" +
              "$" +
              prod.productData.price
          );
      });
      pdfDoc.text("-----");
      pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);
      //끝냈다고하기
      pdfDoc.end();

      //읽고자하는 파일의 경로
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     next(err);
      //   }
      //   //로그인한 상태에서만 file을 다운로드
      //   //브라우저가 들어오는 데이터를 처리하는 방식 : 자동으로 열림
      // res.setHeader("Content-Type", "application/pdf");
      // res.setHeader(
      //   "Content-Disposition",
      //   'inline; filename ="' + invoiceName + '""'
      // );
      //   //자동으로 다운로드 pdf붙여서
      //   res.setHeader(
      //     "Content-Disposition",
      //     'inline; filname ="' + invoiceName + '""'
      //   );
      //   res.send(data);
      // });

      //큰 파일을 제공할 떄 권장하는 방법
      //data chunck 차례로 읽음
      //노드가 모든 데이터를 메모리로 읽어 들이지 않고 클라이언트로 스트리밍 해서
      //한 청크의 데이터만 저장
      //스트림과 버퍼를 다룰 떄에는 청크와 관련있다
      //청크에 접근 권한을 주는게 버퍼
      // const file = fs.createReadStream(invoicePath);
      // // res.setHeader("Content-Type", "application/pdf");
      // // res.setHeader(
      // //   "Content-Disposition",
      // //   'inline; filename ="' + invoiceName + '""'
      // // );
      // file.pipe(res);
    })
    .catch((err) => next(err));
};
