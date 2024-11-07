const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//mongodb는 스키마less인데 스키마를 생성하는 이유?
//특정 스키마에 한정되지않는 유동성이 있지만
//다루는 데이터에는 특정 구조가 있다
const productSchema = new Schema({
  title: {
    type: String,
    required: true,
    //required: true하면 모든 객체가 title을 가지게 됨
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  //_id는 자동으로 추가된다
  userId: {
    type: Schema.Types.ObjectId,
    //ref는 문자열을 가져다가 mongoose에게 해당 필드의 데이터에
    //실제로 연관된 다른 mongoose 모델이 무엇인지 알려준다
    ref: 'User',
    required: true,
  },
});

//첫번쨰 인자: 프로젝트나 애플리케이션의 개체를 나타내는 이름
//두번째 인자: 스키마로 정의한거
//collection으로 첫번쨰 인자의 s붙인게 사용된다
module.exports = mongoose.model('Product', productSchema);
