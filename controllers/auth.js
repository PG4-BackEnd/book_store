const crypto = require("crypto"); //무작위값생성해주는거
const bcrypt = require("bcryptjs");
// const nodemailer = require("nodemailer");
// const sendgridTransport = require("nodemailer-sendgrid-transport");
const User = require("../models/user");

//routes의 폴더의 auth.js에서 미들웨어가 오류 수집한다 그 결과가
//validationResult에 저장됨
const { validationResult } = require("express-validator");

// const sgMail = require("@sendgrid/mail");
// wsgMail.setApiKey(process.env.SENDGRID_API_KEY);

// const transporter = nodemailer.createTransport(
//   sendgridTransport({

//   })
// );

const handleServerError = (err, next) => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
};

// csrf
// cross site request forgery
// session을 훔치는 방법=>fakse site
// sol -> fake site에서 session을 사용할수없게함
exports.getLogin = (req, res, next) => {
  //const isLoggedIn = req.get("Cookie").split(":")[1].trim().split("=")[1];

  //const isLoggedIn = true;
  //console.log(req.flash("error"));
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  console.log("getlogin", message);
  // console.log(message);
  //console.log(isLoggedIn);
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
    },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  console.log(message);

  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

//쿠기는 클라이언트 측에 저장된다
//쿠기는 브라우저에 저장된다, 쿠기는 조작될수있다
//브라우저를 닫으면 디폴트로 만료되는 쿠키를 세션쿠키라함
//세션쿠키를 세션을 식별하는 쿠키가 아님
//만료 날짜나 쿠키가 무효화되는 수명을 설정하는 쿠키는 지속 쿠키라함
//브라우저를 닫을 때 사라지지않아서 지속쿠키라함

//session은 서버측에 저장된다
//서버에 있어서 사용자가 조작하거나 볼수없음
//요청에 데이터를 저장할수있지만 새요청을 만들  떄마다 데이터를 잃음
//사용자 인증에 사용됨
//세션쿠키 지속쿠키 상관없이 사용가능
//session은 서버에 저장되기에 storage고를수있다
exports.postLogin = (req, res, next) => {
  //req.isLoggedIn = true;
  //redirect 될때마다 req는 새로생긴다
  //쿠기는 조작될수있어서 민감한 데이터를 저장하는건 좋지않다
  //res.setHeader("Set-Cookie", "loggedIn=true; Expires=1"); //key value로 , 만기일 초단위이다
  //res.setHeader("Set-Cookie", "loggedIn=true; Max-Age=10"); //key value로, expire없으면 브라우저 닫는순간 만기됨
  //res.setHeader("Set-Cookie", "loggedIn=true; Secure"); //key value로, https 페이지를 통해 제공할 때만 쿠기가 설정됨
  //res.setHeader("Set-Cookie", "loggedIn=true; HttpOnly"); //key value로

  //사용자를 식별하기 위해 여전히 쿠키,가 필요하지만 민감한 정보는 서버에 저장됨
  //데이터베이스가 아니라 메모리에 저장
  //메모리 자원은 한정됨
  const email = req.body.email;
  const password = req.body.password;
  console.log("postlogin", email);
  //   console.log(email);
  //   console.log(password);

  const errors = validationResult(req);
  //비어있지않으면 에러가 발생했다는거
  if (!errors.isEmpty()) {
    console.log(errors.array());
    //render하므로 같은 페이지를 보여줌
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      //array가 object Object라 제일처음거만
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          //array가 object Object라 제일처음거만
          errorMessage: "Invalid email or password",
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      }
      console.log(user.email);
      console.log(user.password);

      //해쉬한 비밀번호와 그냥 비밀번호를 비교한 후 promise를 반환한ㄷ
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            //array가 object Object라 제일처음거만
            errorMessage: "Invalid email or password",
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [],
          });
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });

      //res.redirect("/"); //redirect는 독립적으로 실행됨 너무 일찍일어날수있음
    })
    .catch((err) => {
      //console.log(err);
      handleServerError(err, next);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  //비어있지않으면 에러가 발생했다는거
  if (!errors.isEmpty()) {
    console.log(errors.array());
    //render하므로 같은 페이지를 보여줌
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      //array가 object Object라 제일처음거만
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }
  //email이 2개이상 중복되면안됨
  //   User.findOne({ email: email })
  //     .then((userDoc) => {
  //       if (userDoc) {
  //         //동일한 email을 가진 유저가 있다
  //         req.flash("error", "Email exists already, please pick up another");
  //         return res.redirect("/signup");
  //       }
  //동일한 이메일 가진애가 없다면
  //해쉬하고싶은거, 번호는 높을수록 보안높고 오래걸림
  //async task라 promise를 반환하도록해야함
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      res.redirect("/login");

      //   return transporter.sendMail({
      //     to: email,
      //     from: "junseong5832@naver.com",
      //     subject: "Signup succeeded!",
      //     html: `<h1>You successfully signed up! </h1>`,
      //   });

      /*
      return sgMail.send(msg);
      */
    })
    .catch((err) => {
      //console.log(err);
      handleServerError(err, next);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  console.log(message);

  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    //buffer로 토큰생성, 버퍼가 16진법값 저장 =>hex
    const token = buffer.toString("hex");
    //req.body: HTTP 요청의 본문
    //일반적으로 POST, PUT, PATCH 요청에서 사용되며,
    // 클라이언트가 서버로 데이터를 보낼 때 사용
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        //ms단위로 입력되야함,  1s는 1000ms => *3600 => 1시간
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        // transporter.sendMail({
        //   to: req.body.email,
        //   from: "junseong5832@naver.com",
        //   subject: "Password reset",
        //   html: `<p>You requested a password reset </p>
        //   <p>Click this <a href="http://localhost:3000/reset/${token}">link to set a new password.</p>`,
        // });
      })
      .catch((err) => {
        //console.log(err);
        handleServerError(err, next);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  //req.params: URL 경로 매개변수,  URL 자체에 포함된 변수
  const token = req.params.token;
  //gt는 greater than
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      console.log(message);

      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      //      console.log(err);
      handleServerError(err, next);
    });
};

exports.postNewPassword = (req, res, next) => {
  //new-password.ejs에서 name으로 password, userId라고 저장해놧음
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      //hash 사용 bcrypt
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      //        console.log(err);
      handleServerError(err, next);
    });
};
