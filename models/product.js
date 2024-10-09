const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//mongodb는 스키마less인데 스키마를 생성하는 이유?
//특정 스키마에 한정되지않는 유동성이 있지만
//다루는 데이터에는 특정 구조가 있다
const productSchema = new Schema({
  title: {
    type: String,
    required: true,
    //required: true하면 모든 객체가 title을 가지게 됨
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  //_id는 자동으로 추가된다
  userId: {
    type: Schema.Types.ObjectId,
    //ref는 문자열을 가져다가 mongoose에게 해당 필드의 데이터에
    //실제로 연관된 다른 mongoose 모델이 무엇인지 알려준다
    ref: "User",
    required: true,
  },
});

//첫번쨰 인자: 프로젝트나 애플리케이션의 개체를 나타내는 이름
//두번째 인자: 스키마로 정의한거
//collection으로 첫번쨰 인자의 s붙인게 사용된다
module.exports = mongoose.model("Product", productSchema);

// const mongodb = require("mongodb");
// const getDb = require("../util/database").getDb;

// class Product {
//   constructor(title, price, description, imageUrl, id, userId) {
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imageUrl = imageUrl;
//     this._id = id ? new mongodb.ObjectId(id) : null;
//     //    this._id = new mongodb.ObjectId(id);

//     this.userId = userId;
//   }

//   save() {
//     const db = getDb();
//     let dbOp;
//     if (this._id) {
//       // Update the product
//       dbOp = db
//         .collection("products")
//         .updateOne({ _id: this._id }, { $set: this });
//     } else {
//       dbOp = db.collection("products").insertOne(this);
//     }
//     return dbOp
//       .then((result) => {
//         console.log(result);
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   static fetchAll() {
//     const db = getDb();
//     return db
//       .collection("products")
//       .find()
//       .toArray()
//       .then((products) => {
//         console.log(products);
//         return products;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   static findById(prodId) {
//     const db = getDb();
//     return db
//       .collection("products")
//       .find({ _id: new mongodb.ObjectId(prodId) })
//       .next()
//       .then((product) => {
//         console.log(product);
//         return product;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }

//   static deleteById(prodId) {
//     const db = getDb();
//     return db
//       .collection("products")
//       .deleteOne({ _id: new mongodb.ObjectId(prodId) })
//       .then((result) => {
//         console.log("Deleted");
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }
// }

// module.exports = Product;
