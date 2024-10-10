const express = require("express");

const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", [], (req, res, next) => {
  res.render("main", {
    pageTitle: "Main",
    path: "/",
  });

  //   const page = +req.query.page || 1;
  //   let totalItems;

  //   //documents의 개수가 product의 개수
  //   Product.find()
  //     .countDocuments()
  //     .then((numProducts) => {
  //       totalItems = numProducts;
  //       return Product.find()
  //         .skip((page - 1) * ITEMS_PER_PAGE) //2페이지라면 1페이지 넘김, 3페이지라면 1,2페이지넘김
  //         .limit(ITEMS_PER_PAGE);
  //     })

  //     //Product.fetchAll()
  //     .then((products) => {
  //       res.render("main", {
  //         prods: products,
  //         pageTitle: "Shop",
  //         path: "/",
  //         currentPage: page,
  //         hasNextPage: ITEMS_PER_PAGE * page < totalItems,
  //         hasPreviousPage: page > 1,
  //         nextPage: page + 1,
  //         previousPage: page - 1,
  //         lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
  //       });
  //     })
  //     .catch((err) => {
  //       //      console.log(err);
  //       handleServerError(err, next);
  //     });
});
module.exports = router;
