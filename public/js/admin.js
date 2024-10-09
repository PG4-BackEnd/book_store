const deleteProduct = (btn) => {
  const prodId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
  console.log(btn.parentNode);
  console.log(btn);
  //closest 메서드는 DOM 트리를 위로 탐색하면서 주어진 셀렉터와 일치하는 가장 가까운 조상 요소를 반환
  const productElement = btn.closest("article");

  //fetch 함수는 JavaScript에서 HTTP 요청을 보내고 서버로부터 응답을 받아오는 데 사용되는 최신 API
  //fetch는 Promise를 반환하므로 비동기적으로 작동하며, 주로 Ajax 요청을 대체하기 위해 사용
  fetch("/admin/product/" + prodId, {
    method: "DELETE",
    headers: {
      "csrf-token": csrf,
    },
  })
    .then((result) => {
      return result.json(); // 응답을 JSON으로 파싱
    })
    .then((data) => {
      console.log(data);

      productElement.parentNode.removeChild(productElement);
      // DOM에서 요소 제거
    })
    .catch((err) => {
      console.log(err);
    });
};
