const express = require('express');

//js객체라 중괄호
const { check, body } = require('express-validator');
//check은 body, parameter ,query parameter확인
const authController = require('../controllers/auth');

const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);
//normalizeEmail은 Sanitizers 중 하나임 => email의 대문자를 소문자로 등등
//trim은공백제거
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password', 'Password has to be valid.')
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

//middleware인 check()추가, email field 검사 =>유효한지
//isEmail validator, 에러가 발생했을 떄 message -> withMessage
//[]로 묶으면 블록전체에 대한 유효성검사
router.post(
  '/signup',
  [
    //여기서 이미 이메일에 대한 체크하는중
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        //비동기 유효성 검증, express validator가 데이터베이스에 접근해서 가져오는걸 기다려줌
        //userDoc은 데이터베이스에서 찾은 사용자 객체
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            //built in 객체인 promise 사용,
            return Promise.reject(
              'Email exists already, please pick up another'
            );
            //동일한 email을 가진 유저가 있다
          }
        });
      })
      .normalizeEmail(),
    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(), //body에서 암호를 확인하게됨 유효성검사

    //2번쨰인자로 들어가는게 default error message이다
    //isAlphanumeric은 숫자와 문자만 허용
    //withMessage 안하면 default값 invalid message
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
