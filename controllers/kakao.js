const axios = require("axios");

// access token 유효성 검사
const checkAccessToken = async (accessToken) => {
  try {
    const response = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data; // 사용자 정보 반환
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Access token 만료 시 refresh token 사용
      return null; // 유효하지 않음
    }
    throw error;
  }
};

// refresh token을 사용한 access token 갱신
const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "refresh_token",
          client_id: "YOUR_CLIENT_ID",
          refresh_token: refreshToken,
        },
      }
    );
    return response.data.access_token; // 새 access token 반환
  } catch (error) {
    throw error;
  }
};

// 로그인 시도 예시
const loginWithKakaoToken = async (accessToken, refreshToken) => {
  let userInfo = await checkAccessToken(accessToken);

  if (!userInfo) {
    // Access token 만료된 경우
    accessToken = await refreshAccessToken(refreshToken);
    userInfo = await checkAccessToken(accessToken);
  }

  // 사용자 정보로 로그인 처리
  console.log("User Info:", userInfo);
};
