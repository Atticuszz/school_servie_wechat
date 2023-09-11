const cloud = require('wx-server-sdk')
cloud.init({
  env: 'school2service-0gp1dcf9a73528f4'
})

exports.main = async (event, context) => {
  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: cloud.getWXContext().OPENID,
      page: '/pages/order/order',
      templateId: "LKBC9IqOwtwKmzG7G2KSpvs_4dJ45_dSL0_5mum3SfM",
      data: {
        "thing3": {
          "value":  event.customer_name
        },
        "time6": {
          "value": event.deal_time
        },
        "character_string5": {
          "value": event.trade_no
        },
        "thing1": {
          "value": event.goods
        },
        "amount2": {
          "value": event.cost+"元"
        }
      }
    });
    console.log("cloud.openapi.subscribeMessage.send,result:",result);
    return {
      success: true,
      data: result
    };
  } catch (err) {
    console.log("cloud.openapi.subscribeMessage.send,err:",err);
    return {
      success: false,
      error: err
    };
  }
};
