const cloud = require('wx-server-sdk')
cloud.init({
  env: 'school2service-0gp1dcf9a73528f4'
})

exports.main = async (event, context) => {
  const res = await cloud.cloudPay.unifiedOrder({
    "body": event.body,
    "outTradeNo" : event.outTradeNo, //不能重复，否则报错
    "spbillCreateIp" : "127.0.0.1", //就是这个值，不要改
    "subMchId" : "1645165897",  //你的商户ID或子商户ID,
    "totalFee" : parseFloat(event.totalFee)*100,  //单位为分
    "envId": "school2service-0gp1dcf9a73528f4",  //你的云开发环境ID
    "functionName": "paysuc",  //支付成功的回调云函数
    "nonceStr":event.nonceStr,  //随便弄的32位字符串，建议自己生成
    "tradeType":"JSAPI"   //默认是JSAPI
  })
  console.log("Unified Order Response: ", res);
  return res
}