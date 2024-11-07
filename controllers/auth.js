const crypto = require('crypto'); //무작위값생성해주는거
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/user');

const { MONGODB_USER, ADMIN_PASSWORD } = require('../config/prod');

//routes의 폴더의 auth.js에서 미들웨어가 오류 수집한다 그 결과가
//validationResult에 저장됨
const { validationResult } = require('express-validator');
const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com', // Naver의 SMTP 서버 호스트
  service: 'naver', // 이메일 서비스 (Gmail, Yahoo 등)
  port: 587, // SSL/TLS 포트
  secure: false, // 보안 연결 사용
  auth: {
    user: `${MONGODB_USER}@naver.com`, // 발송자 이메일
    pass: `${ADMIN_PASSWORD}`, // 발송자 이메일의 비밀번호
  },
});

const handleServerError = (err, next) => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
};
exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  // console.log("getlogin", message);
  // console.log(message);
  //console.log(isLoggedIn);
  res.render('auth/login', {
    path: '/usrs/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
    },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  // console.log(message);

  res.render('auth/signup', {
    path: '/users/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  // console.log("postlogin", email);

  const errors = validationResult(req);
  //비어있지않으면 에러가 발생했다는거
  if (!errors.isEmpty()) {
    // console.log(errors.array());
    //render하므로 같은 페이지를 보여줌
    return res.status(422).render('auth/login', {
      path: '/users/login',
      pageTitle: 'Login',
      //array가 object Object라 제일처음거만
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email, loginType: 'email' })
    .then((user) => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/users/login',
          pageTitle: 'Login',
          //array가 object Object라 제일처음거만
          errorMessage: 'Invalid email or password',
          oldInput: {
            email: email,
            password: password,
          },
          validationErrors: [],
        });
      }
      // console.log(user.email);
      // console.log(user.password);

      //해쉬한 비밀번호와 그냥 비밀번호를 비교한 후 promise를 반환한ㄷ
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.loginType = 'email';
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect('/');
            });
          }
          return res.status(422).render('auth/login', {
            path: '/users/login',
            pageTitle: 'Login',
            //array가 object Object라 제일처음거만
            errorMessage: 'Invalid email or password',
            oldInput: {
              email: email,
              password: password,
            },
            validationErrors: [],
          });
        })
        .catch((err) => {
          // console.log(err);
          res.redirect('/users/login');
        });

      //res.redirect("/"); //redirect는 독립적으로 실행됨 너무 일찍일어날수있음
    })
    .catch((err) => {
      //console.log(err);
      handleServerError(err, next);
    });
};

exports.postSignup = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;

  const errors = validationResult(req);
  //비어있지않으면 에러가 발생했다는거
  if (!errors.isEmpty()) {
    // console.log(errors.array());
    //render하므로 같은 페이지를 보여줌
    return res.status(422).render('auth/signup', {
      path: '/users/signup',
      pageTitle: 'Signup',
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
  //동일한 이메일 가진애가 없다면
  //해쉬하고싶은거, 번호는 높을수록 보안높고 오래걸림
  //async task라 promise를 반환하도록해야함
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        loginType: 'email',
        cart: { items: [] },
      });
      return user.save();
    })
    .then((result) => {
      const mailOptions = {
        from: `${MONGODB_USER}@naver.com`, // 발송자 이메일
        to: email, // 수신자 이메일
        subject: '회원 가입 성공', // 이메일 제목
        text: '회원 가입 성공!', // 이메일 본문
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
      res.redirect('/users/login');
    })
    .catch((err) => {
      handleServerError(err, next);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    // console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  // console.log(message);

  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      // console.log(err);
      return res.redirect('/users/reset');
    }
    //buffer로 토큰생성, 버퍼가 16진법값 저장 =>hex
    const token = buffer.toString('hex');
    //req.body: HTTP 요청의 본문
    //일반적으로 POST, PUT, PATCH 요청에서 사용되며,
    // 클라이언트가 서버로 데이터를 보낼 때 사용
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash('error', 'No account with that email found');
          return res.redirect('/users/reset');
        }
        user.resetToken = token;
        //ms단위로 입력되야함,  1s는 1000ms => *3600 => 1시간
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect('/');
      })
      .catch((err) => {
        if (!res.headersSent) {
          handleServerError(err, next);
        }
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
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      // console.log(message);

      res.render('auth/new-password', {
        path: '/users/new-password',
        pageTitle: 'New Password',
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
  const { newPassword, userId, passwordToken } = req.body;
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
      res.redirect('/users/login');
    })
    .catch((err) => {
      //        console.log(err);
      handleServerError(err, next);
    });
};
