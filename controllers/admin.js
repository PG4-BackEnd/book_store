const mongoose = require("mongoose");

const fileHelper = require("../util/file");
const Product = require("../models/product");
const { validationResult } = require("express-validator");

const handleServerError = (err, next) => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
};

exports.getAddProduct = (req, res, next) => {
  //라우터 보호
  /*
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }
    */
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const price = req.body.price;
  const description = req.body.description;
  //const image = req.body.image;
  const image = req.file;
  console.log("postAddProduct image", image);

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      path: "/admin/add-products",
      pageTitle: "Add Product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },

      //array가 object Object라 제일처음거만
      errorMessage: "Attached file is not an image",
      validationErrors: [],
    });
  }

  const errors = validationResult(req);

  //비어있지않으면 에러가 발생했다는거
  if (!errors.isEmpty()) {
    console.log(errors.array());
    //render하므로 같은 페이지를 보여줌
    return res.status(422).render("admin/edit-product", {
      path: "/admin/add-products",
      pageTitle: "Add Product",
      editing: false,
      hasError: true,
      product: {
        title: title,

        price: price,
        description: description,
      },

      //array가 object Object라 제일처음거만
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  //운영체제에 있는 파일의 경로
  const imageUrl = image.path;
  // console.log("postAddProduct imageurl", imageUrl);
  console.log("req.user", req.user);
  const product = new Product({
    // _id: mongoose.Types.ObjectId("667d098532f7f4366f2a53de"),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user, //전체사용자가 아니라 원하는 id만 보임
    //userId: req.user._id,
  });

  /*
  const product = new Product(
    title,
    price,
    description,
    imageUrl,
    null,
    (req.user._id = null ? 1 : req.user._id)
  );
  */
  //mongoose에 save 메서드가 빌트인
  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      //res.redirect("/500");
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      //인자로 error를 넘기면 express에서 다른 모든 미들웨어를
      //건너뛰고 오류처리 미들웨어로 이동한다
    });
};

exports.getEditProduct = (req, res, next) => {
  //query에 edit=true라고 저장해놨음
  const editMode = req.query.edit;
  console.log(editMode);
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  console.log("getEditProduct", prodId);
  Product.findById(prodId)
    // Product.findById(prodId)
    .then((product) => {
      //throw new Error("Dummy");
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      //console.log(err);
      //res.redirect("/500");
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
      handleServerError(err, next);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  // const updatedImageUrl = req.body.imageUrl;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  //비어있지않으면 에러가 발생했다는거
  if (!errors.isEmpty()) {
    console.log(errors.array());
    //render하므로 같은 페이지를 보여줌
    return res.status(422).render("admin/edit-product", {
      path: "/admin/edit-products",
      pageTitle: "Edit Product",
      editing: false,
      hasError: true,
      product: {
        title: updatedTitle,
        imageUrl: image,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },

      //array가 object Object라 제일처음거만
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  /*
  const product = new Product(
    updatedTitle,
    updatedPrice,
    updatedDesc,
    updatedImageUrl,
    prodId
  );
  */
  Product.findById(prodId)
    .then((product) => {
      //현재사용자랑 다르다면
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      // product.imageUrl = updatedImage;
      if (image) {
        //callback함수 2번쨰함수로 전달
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save().then((result) => {
        console.log("UPDATED PRODUCT!");
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      // console.log(err);
      handleServerError(err, next);
    });
};

exports.getProducts = (req, res, next) => {
  //반환결과 cursor가 아니라 문서를 준다

  //cursor 정의: 커서는 데이터베이스 쿼리의 결과를 순회(iterate)할 수 있는 객체
  //특징:메모리에 한 번에 모든 데이터를 로드하지 않고, 필요할 때 데이터를 점진적으로 가져옴
  //대용량 데이터 집합을 다룰 때 유리.find() 메서드는 기본적으로 커서를 반환

  //document 정의: 데이터베이스 쿼리의 결과로 반환된 개별 데이터 객체
  //특징 : 한 번에 모든 데이터를 메모리에 로드
  //소규모 데이터 집합을 다룰 때 유리
  //exec() 메서드나 then()을 사용하여 쿼리 결과를 문서 배열로 반환할 수 있음

  // populate는 userId 필드가 참조하는 User 컬렉션의 문서를 자동으로 불러옴.
  //이로 인해 Product 문서에는 단순히 userId 필드만 포함되는 것이 아니라,
  //해당 ID가 참조하는 User 문서 전체가 포함됨

  //사용자제한 => app.js에서 req.user에 저장했음

  console.log(req.user._id);

  //promise사용
  Product.find({ userId: req.user._id })
    //   .select("title price -_id") //필요한 것만 선택하고 필요없으면 -함
    // .populate("userId", "name") // userId 필드를 통해 참조된 User 데이터를 가져옴
    //Product.fetchAll()
    .then((products) => {
      console.log(products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      //console.log(err);
      handleServerError(err, next);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  console.log(prodId);
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found"));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log("DESTROYED PRODUCT");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      //console.log(err);
      handleServerError(err, next);
    });
  // .catch((err) => {
  //   next(err);
  // });
  // Product.deleteOne({ _id: prodId, userId: req.user._id })
  //   //mongoose 메소드인 findByIdAndRemove
  //   //Product.findByIdAndRemove(prodId)
  //   //Product.deleteById(prodId)
  //   .then(() => {
  //     console.log("DESTROYED PRODUCT");
  //     res.redirect("/admin/products");
  //   })
  //   .catch((err) => {
  //     //console.log(err);
  //     handleServerError(err, next);
  //   });
};

exports.deleteProduct = (req, res, next) => {
  //url에 있다
  const prodId = req.params.productId;
  console.log(prodId);
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found"));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log("DESTROYED PRODUCT");
      res.status(200).json({ message: "Success!" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Deleting product failed" });
    });
};
