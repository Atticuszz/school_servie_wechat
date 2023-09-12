// 云函数：notifyDelivery.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'school2service-0gp1dcf9a73528f4'
})

exports.main = async (event, context) => {
  console.log("cloud function 'arrived' started, received event:", event); // 打印传入的参数

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: event.openid, // 注意，这里我们传递openid作为参数，因为我们在handleCellTap中已经知道了用户的openid
      page: '/pages/order/order',
      templateId: "qAVo5ed6_mwB4D1WYVaI7xULItzxOUR8_-P5v_bgleg",
      data: {
        "character_string1": {
          "value": event.trade_no
        },
        "thing8": {
          "value": event.goods
        },
        "thing10": {
          "value": event.address
        },
        "amount7": {
          "value": event.cost + "元"
        },
        "time2": {
          "value": event.deal_time
        }
      }
    });

    console.log("cloud.openapi.subscribeMessage.send for delivery,result:", result.message); // 打印订阅消息的结果
    return {
      success: true,
      data: result.message
    };
  } catch (err) {
    console.log("cloud.openapi.subscribeMessage.send for delivery,err:", err.message); // 打印任何错误
    return {
      success: false,
      error: err.message
    };
  }
};

