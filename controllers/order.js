const Order = require("../models/order");
const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const qs = require("querystring");
const axios = require("axios");

const { origin } = require("../config/prod");

const handleServerError = (err, next) => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
};

const generateInvoice = (order) => {
  // 파일 경로 설정
  const invoicePath = path.join(
    __dirname,
    "..",
    "data",
    "invoices",
    `invoice-${order._id}.pdf`
  );

  // 디렉토리가 없으면 생성
  const invoiceDir = path.dirname(invoicePath);
  if (!fs.existsSync(invoiceDir)) {
    fs.mkdirSync(invoiceDir, { recursive: true }); // 중첩된 디렉토리도 생성 가능
  }

  // PDF 파일 생성
  const pdfDoc = new PDFDocument();

  pdfDoc.pipe(fs.createWriteStream(invoicePath));

  // PDF 내용 작성
  pdfDoc.fontSize(26).text("Invoice", {
    underline: true,
  });
  pdfDoc.text("--------------------");

  pdfDoc.text(`Invoice for Order: ${order._id}`);
  pdfDoc.text("-----");
  let totalPrice = 0;
  order.products.forEach((prod) => {
    totalPrice += prod.quantity * prod.productData.price;
    pdfDoc
      .fontSize(14)
      .text(
        prod.productData.title +
          "-" +
          prod.quantity +
          "x" +
          "$" +
          prod.productData.price
      );
  });
  pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);
  pdfDoc.text(`Order Date: ${new Date().toLocaleDateString()}`);
  pdfDoc.text("-----");

  // PDF 저장 후 종료
  pdfDoc.end();

  return { invoicePath, totalPrice };
};
const sendKakaoMessage = async (user, order, invoicePath, totalPrice) => {
  const kakaoApiUrl = "https://kapi.kakao.com/v2/api/talk/memo/default/send"; // 카카오 메시지 API URL
  const accessToken = user.accessToken;

  // 카카오 메시지 템플릿 내용 정의
  const messageContent = {
    object_type: "text",
    text: `주문이 완료되었습니다!\n주문 번호: ${order._id}\n총 금액: ${totalPrice}$\n인보이스가 첨부되었습니다.`,
    link: {
      web_url: `${origin}/orders/${order._id}`,
      mobile_web_url: `${origin}/orders/${order._id}`,
    },
    button_title: "주문 확인",
  };

  try {
    // POST 요청으로 메시지 전송
    await axios.post(
      kakaoApiUrl,
      {
        template_object: JSON.stringify(messageContent), // JSON으로 변환
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${accessToken}`, // 사용자 토큰
        },
      }
    );

    console.log("카카오톡 메시지 전송 완료");

    // PDF 인보이스 파일을 첨부하는 로직 추가
    // console.log(`Invoice 파일 경로: ${invoicePath}`);
  } catch (error) {
    console.error(
      "카카오톡 메시지 전송 실패",
      error.response ? error.response.data : error.message
    );
  }
};
exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    //.execPopulate() // execPopulate()는 populate() 메서드가 반환하는 쿼리 객체를 실행하여 Promise를 반환
    .then((user) => {
      //   console.log(user.cart.items);
      //user.cart.items는 productId와 quantity 둘다있다
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, productData: { ...i.productId._doc } };
        //: 전개 연산자(...)를 사용하여 _doc 속성의 모든 필드를 productData 객체로 복사합니다.
      });

      const order = new Order({
        user: {
          email: req.user.loginType === "email" ? req.user.email : undefined,
          userId: req.user,
          loginType: req.user.loginType,
        },
        products: products,
      });
      return order.save();
    })
    .then(async (order) => {
      //result가 promise니 여기에 있는 _id 사용
      // 주문이 성공적으로 저장된 후 인보이스 생성
      const { invoicePath, totalPrice } = generateInvoice(order);
      //   console.log(invoicePath, totalPrice);
      //카카오톡 메시지 전송
      //   console.log("postorder", order);
      await sendKakaoMessage(req.user, order, invoicePath, totalPrice); // 카카오톡 메시지 전송
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      //      console.log(err);
      handleServerError(err, next);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      //  console.log(err);
      handleServerError(err, next);
    });
};
exports.getInvoice = (req, res, next) => {
  //orderid 체크
  //url에 orderid전달했음
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      // })
      // .catch((err) => {
      //   next(err);
      // });
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      //읽을수있는 스트림이다
      const pdfDoc = new PDFDocument();
      //Content-Type 헤더를 application/pdf로 설정하여 클라이언트에게 반환되는 데이터가 PDF 파일임을 알림
      res.setHeader("Content-Type", "application/pdf");
      //Content-Disposition 헤더를 inline; filename="invoiceName"으로 설정하여 브라우저가 PDF 파일을 인라인으로 표시하도록 하고,
      // 파일 이름을 invoiceName으로 지정

      //HTTP 응답 헤더의 Content-Disposition 필드에서 inline 값을 사용하면, 브라우저는 해당 파일을 다운로드하지 않고,
      //브라우저 내에서 바로 표시(미리보기)하려고 시도. 반면, attachment 값을 사용하면 브라우저는 해당 파일을 다운로드하도록 합니다.
      res.setHeader(
        "Content-Disposition",
        'inline; filename ="' + invoiceName + '""'
      );
      //pipe는 Node.js에서 스트림(Stream)을 다룰 때 사용되는 메서드
      //스트림은 데이터의 흐름을 나타내며, 파일 읽기/쓰기, 네트워크 통신 등에서 데이터를 조작할 때 유용하게 사용
      //pipe 메서드는 한 스트림에서 다른 스트림으로 데이터를 전송하도록 도와주는 메커니즘
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      // PDF 문서 객체를 HTTP 응답 스트림 res에도 연결하여 클라이언트에 전송
      pdfDoc.pipe(res);
      //쓰기
      // pdfDoc.text("hello world");
      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });
      pdfDoc.text("--------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.productData.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.productData.title +
              "-" +
              prod.quantity +
              "x" +
              "$" +
              prod.productData.price
          );
      });
      pdfDoc.text("-----");
      pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);
      //   console.log("aaa", pdfDoc);
      //끝냈다고하기
      pdfDoc.end();

      //읽고자하는 파일의 경로
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     next(err);
      //   }
      //   //로그인한 상태에서만 file을 다운로드
      //   //브라우저가 들어오는 데이터를 처리하는 방식 : 자동으로 열림
      // res.setHeader("Content-Type", "application/pdf");
      // res.setHeader(
      //   "Content-Disposition",
      //   'inline; filename ="' + invoiceName + '""'
      // );
      //   //자동으로 다운로드 pdf붙여서
      //   res.setHeader(
      //     "Content-Disposition",
      //     'inline; filname ="' + invoiceName + '""'
      //   );
      //   res.send(data);
      // });

      //큰 파일을 제공할 떄 권장하는 방법
      //data chunck 차례로 읽음
      //노드가 모든 데이터를 메모리로 읽어 들이지 않고 클라이언트로 스트리밍 해서
      //한 청크의 데이터만 저장
      //스트림과 버퍼를 다룰 떄에는 청크와 관련있다
      //청크에 접근 권한을 주는게 버퍼
      // const file = fs.createReadStream(invoicePath);
      // // res.setHeader("Content-Type", "application/pdf");
      // // res.setHeader(
      // //   "Content-Disposition",
      // //   'inline; filename ="' + invoiceName + '""'
      // // );
      // file.pipe(res);
    })
    .catch((err) => next(err));
};
