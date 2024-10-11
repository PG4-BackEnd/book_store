const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = new Schema({
  email: {
    type: String,
    required: function () {
      return this.loginType === "email"; // 이메일 로그인인 경우에만 필수
    },
  },
  password: {
    type: String,
    required: function () {
      return this.loginType === "email"; // 이메일 로그인인 경우에만 필수
    },
  },
  kakaoId: {
    type: String,
    required: function () {
      return this.loginType === "kakao"; // 카카오 로그인인 경우 필수
    },
  },
  accessToken: {
    type: String,
    required: false,
  },
  refreshToken: {
    type: String,
    required: false,
  },
  loginType: {
    type: String,
    enum: ["email", "kakao"],
    required: true,
  }, // 로그인 타입 구분

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
