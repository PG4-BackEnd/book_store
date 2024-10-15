const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const flash = require("connect-flash");
const csrf = require("csurf");
const User = require("./models/user");

//변수 설정
dotenv.config();
const app = express();
const csrfProtection = csrf({ cookie: true });
const { MONGODB_URI, origin } = require("./config/prod");
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "kakaoSession", //session을 저장하는 컬렉션, 이름자유
});
//파일의 저장 위치, 이름을 어떻게 처리할지 제어
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images"); //err message , images folder(저장하고자하는위치)
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  },
});
//파일 필터링
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true); //저장하고싶으면 true
  } else {
    cb(null, false); //저장하기싫으면 false
  }
};
let corsOptions = {
  origin: origin,
  credentials: true,
};
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const productRoutes = require("./routes/product");
const authRoutes = require("./routes/auth");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const errorController = require("./controllers/error");
const homeRoutes = require("./routes/home");
const kakaoAuthRoutes = require("./routes/kakaoAuth");
const checkoutRoutes = require("./routes/checkout");
// 뷰 엔진 설정
app.set("view engine", "ejs");
// 뷰 파일들의 디렉토리 설정
app.set("views", "views");
//미들웨어 설정
app.use(express.urlencoded({ extended: false })); //HTML 폼에서 전송된 URL 인코딩된 데이터를 처리
app.use(express.json()); //JSON 형식으로 전송된 데이터를 처리
app.use(cookieParser()); //요청 헤더의 Cookie 필드에 있는 쿠키 문자열을 파싱하여, 객체 형태로 변환
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { secure: false },
  })
);

app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(flash());
app.use(csrfProtection);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.loginType = req.session.loginType;
  res.locals.csrfToken = req.csrfToken(true);
  next();
});

//라우터 설정
app.use("/", homeRoutes);
app.use("/users", authRoutes);
app.use("/oauth", kakaoAuthRoutes);
app.use("/admin", adminRoutes);
app.use("/shop", shopRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/products", productRoutes);
app.use("/checkout", checkoutRoutes);
app.get("/500", errorController.get500);
app.use(errorController.get404);
mongoose
  .connect(MONGODB_URI)
  .then((reuslt) => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT);
  })
  .catch((err) => {
    console.log(err);
  });
