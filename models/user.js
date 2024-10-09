const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,

  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
    //===은 값과 type까지 같아야함
    //js에서 문자열처럼 사용해도 문자열이 아님 objectid타입
    //return cp.productId == product._id;
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    //이미존재할떄 오버라이딩 하지않고 +1만함
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    //cart가 존재하지 않을 때
    updatedCartItems.push({
      productId: product._id, //mongoose가 objectid에 자동으로 포함시킴
      quantity: newQuantity,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
// const mongodb = require("mongodb");
// const getDb = require("../util/database").getDb;

// const ObjectId = mongodb.ObjectId;

// class User {
//   constructor(username, email, cart, id) {
//     this.name = username;
//     this.email = email;
//     this.cart = cart; // {items: []} object임
//     this._id = id;
//   }

//   save() {
//     const db = getDb();
//     return db.collection("users").insertOne(this);
//   }

//   addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex((cp) => {
//       return cp.productId.toString() === product._id.toString();
//       //===은 값과 type까지 같아야함
//       //js에서 문자열처럼 사용해도 문자열이 아님 objectid타입
//       //return cp.productId == product._id;
//     });
//     let newQuantity = 1;
//     const updatedCartItems = [...this.cart.items];

//     if (cartProductIndex >= 0) {
//       newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//       //이미존재할떄 오버라이딩 하지않고 +1만함
//       updatedCartItems[cartProductIndex].quantity = newQuantity;
//     } else {
//       //cart가 존재하지 않을 때
//       updatedCartItems.push({
//         productId: new ObjectId(product._id),
//         quantity: newQuantity,
//       });
//     }

//     //product.quantity = 1;
//     //const updatedCart = { items: [{ ...product, quantity: 1 }] };
//     const updatedCart = {
//       //items: [{ productId: new ObjectId(product._id), quantity: newQuantity }],
//       items: updatedCartItems,
//     };
//     const db = getDb();
//     return db.collection("users").updateOne(
//       { _id: new ObjectId(this._id) },
//       { $set: { cart: updatedCart } } //오버라이딩하는거
//     );
//   }
//   getCart() {
//     const db = getDb();
//     //배열임 productIds는
//     const productIds = this.cart.items.map((i) => {
//       return i.productId;
//     });
//     // cursor(커서)는 데이터베이스 쿼리의 결과 집합을 나타내는 객체
//     // 쿼리를 수행할 때, 데이터베이스는 해당 쿼리와 일치하는 문서들을 커서에 담아 반환
//     //js 배열로 변환

//     //productIds가 비어있을 떄는 users의 cart의 items의 product id와 products의 product id가 일치하지 않는다
//     //해결방안: 1주일마다 혹은 하루마다 장바구니전체를 초기화
//     //빈 제품을 받았는데 장바구니에 아이템이 있다면 장바구니를 초기화시켜도됨
//     //데이터 베이스로부터 받은 데이터에 장바구니에 있는 것보다 제품이 적다면
//     //장바구니 업데이트
//     return db
//       .collection("products")
//       .find({ _id: { $in: productIds } })
//       .toArray()
//       .then((products) => {
//         return products.map((p) => {
//           return {
//             ...p,
//             quantity: this.cart.items.find((i) => {
//               return i.productId.toString() === p._id.toString();
//             }).quantity,
//           };
//         });
//       });
//   }
//   //static 키워드를 사용하지 않은 메서드는
//   //클래스의 인스턴스에 속하게 된다
//   //const user = new User('Alice'); , user.getCart();

//   deleteItemFromCart(productId) {
//     //const updatedCartItems = [...this.cart.items];
//     //vanila js 기능 =>filter
//     // productid와 같은걸 삭제하려고 하는 상황 같지않은건 냅둠
//     //원하는 품목을 계속 담아두려면 true를 return
//     const updatedCartItems = this.cart.items.filter((item) => {
//       return item.productId.toString() !== productId.toString();
//     });
//     const db = getDb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: new ObjectId(this._id) },
//         { $set: { cart: { items: updatedCartItems } } }
//       );
//   }

//   addOrder() {
//     const db = getDb();
//     return this.getCart()
//       .then((products) => {
//         const order = {
//           items: products,
//           user: {
//             _id: new ObjectId(this._id),
//             name: this.name,
//           },
//         };
//         return db.collection("orders").insertOne(order);
//       })
//       .then((result) => {
//         this.cart = { items: [] };
//         //데이터베이스에 있는것도 비워야함
//         return db
//           .collection("users")
//           .updateOne(
//             { _id: new ObjectId(this._id) },
//             { $set: { cart: { items: [] } } }
//           );
//       });
//   }
//   getOrders() {
//     const db = getDb();
//     //""안에 경로적어야함, 사용자 id같은거 주는데 여러개일수있음
//     return db
//       .collection("orders")
//       .find({ "user._id": new ObjectId(this._id) })
//       .toArray();
//   }

//   //클래스 메서드를 static 키워드로 선언하면,
//   //해당 메서드는 클래스 자체에 속하게 된다
//   //User.findById(1) 가능
//   static findById(userId) {
//     const db = getDb();
//     return db
//       .collection("users")
//       .findOne({ _id: new ObjectId(userId) })
//       .then((user) => {
//         console.log(user);
//         return user;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//   }
// }

// module.exports = User;
