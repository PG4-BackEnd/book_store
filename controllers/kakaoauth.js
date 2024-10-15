const qs = require("qs"); //query string
const axios = require("axios"); //axios는 HTTP 요청을 보내기 위한 라이브러리 ,Promise 기반이기 때문에 비동기 처리를 쉽게함
const User = require("../models/user");

const {
  kakaoClientID,
  kakaoClientSecret,
  redirect_uri,
  token_uri,
  api_host,
  origin,
} = require("../config/prod");

const redirect = async function (req, res) {
  const param = qs.stringify({
    grant_type: "authorization_code",
    client_id: kakaoClientID,
    redirect_uri: redirect_uri,
    client_secret: kakaoClientSecret,
    code: req.query.code,
  });
  const header = { "content-type": "application/x-www-form-urlencoded" };
  var rtn = await call("POST", token_uri, param, header);
  console.log(1);
  console.log("rtn ", rtn);
  await saveUser(req, rtn);
  //여기서 세션에 access 토큰 저장한다

  res.status(302).redirect(`${origin}`);
};
const authorize = function (req, res) {
  let { scope } = req.query;
  console.log("scope: " + scope);
  let scopeParam = "";
  if (scope) {
    scopeParam = "&scope=" + scope;
  }
  console.log("scopeParam: " + scopeParam);

  res
    .status(302)
    .redirect(
      `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientID}&redirect_uri=${redirect_uri}&response_type=code${scopeParam}`
    );
};
const profile = async function (req, res) {
  console.log("profile");
  const uri = api_host + "/v2/user/me";
  const param = {};
  const header = {
    "content-Type": "application/x-www-form-urlencoded",
    Authorization: "Bearer " + req.session.key,
  };
  try {
    var rtn = await call("POST", uri, param, header);
    console.log("profile", rtn);
    res.render("oauth/profile", {
      path: "/oauth/profile",
      pageTitle: "oauth Profile",
      userProfile: rtn,
    });
  } catch (error) {
    res.status(500).send("Error fetching profile.");
  }
};
const getMessage = function (req, res) {
  console.log("get message");
  res.render("oauth/message", {
    path: "/oauth/message",
    pageTitle: "oauth my message",
  });
};
const postMessage = async function (req, res) {
  console.log("message");
  const uri = api_host + "/v2/api/talk/memo/default/send";
  const userMessage = req.body.message;
  console.log(userMessage);

  const templateObject = {
    object_type: "text",
    text: userMessage, // 클라이언트로부터 받은 메시지 내용
    link: {
      web_url: "https://developers.kakao.com",
      mobile_web_url: "https://developers.kakao.com",
    },
    button_title: "바로 확인",
  };

  const param = qs.stringify({
    template_object: JSON.stringify(templateObject),
  });

  const header = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: "Bearer " + req.session.key,
  };

  try {
    const rtn = await call("POST", uri, param, header);
    console.log("Message sent successfully:", rtn);
    res.render("oauth/message", {
      path: "/oauth/message",
      pageTitle: "oauth my message",
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send("Failed to send message.");
  }
};
const logout = async function (req, res) {
  console.log("logout");
  const uri = api_host + "/v1/user/logout";
  const param = null;
  const header = {
    Authorization: "Bearer " + req.session.key,
  };
  await call("POST", uri, param, header);
  await postLogout(req, res);
};

//함수
async function call(method, uri, param, header) {
  try {
    rtn = await axios({
      method: method,
      url: uri,
      headers: header,
      data: param,
    });
  } catch (err) {
    rtn = err.response;
  }
  return rtn.data;
}
async function saveUser(req, tokens) {
  // 액세스 토큰으로 사용자 정보 요청
  const userInfoResponse = await axios.get(`${api_host}/v2/user/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const kakaoUser = userInfoResponse.data;
  // console.log("Kakao user info: ", kakaoUser);
  // console.log("--------------------------------");

  // 데이터베이스에서 사용자 확인 또는 생성
  let user = await User.findOne({ kakaoId: kakaoUser.id });

  if (!user) {
    // 사용자가 없으면 새로 생성
    user = new User({
      kakaoId: kakaoUser.id,
      email: kakaoUser.kakao_account.email, // 이메일을 카카오로부터 얻은 경우에만 저장
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresIn: new Date(Date.now() + tokens.expires_in * 1000),
      refreshTokenExpiresIn: new Date(
        Date.now() + tokens.refresh_token_expires_in * 1000
      ),
      loginType: "kakao",
    });
  } else {
    // 사용자가 있으면 토큰 업데이트
    // console.log("token updated");
    user.accessToken = tokens.access_token;
    user.refreshToken = tokens.refresh_token;
    user.accessTokenExpiresIn = new Date(Date.now() + tokens.expires_in * 1000);
    user.refreshTokenExpiresIn = new Date(
      Date.now() + tokens.refresh_token_expires_in * 1000
    );
  }
  await user.save();
  req.session.isLoggedIn = true;
  req.session.loginType = "kakao";
  req.session.user = user;
  req.session.key = tokens.access_token;
  await req.session.save();
  console.log("User saved and session updated");
  return;
}

postLogout = async (req, res) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};
module.exports = {
  redirect,
  authorize,
  profile,
  getMessage,
  postMessage,
  logout,
};
