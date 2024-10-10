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
