module.exports = {
  kakaoClientID: process.env.KAKAO_CLIENT_ID,
  kakaoClientSecret: process.env.KAKAO_CLIENT_SECRET,
  MONGODB_URI: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@clusterjun.gkdzqpq.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`,
  redirect_uri: `http://localhost:${process.env.PORT}/oauth/redirect`,
  token_uri: 'https://kauth.kakao.com/oauth/token',
  api_host: 'https://kapi.kakao.com',
  origin: `http://localhost:${process.env.PORT}`,
  private_stripe_key: process.env.PRIVATE_STRIPE_KEY,
  gmail_password: process.env.GOOGLE_PASSWORD,
};
