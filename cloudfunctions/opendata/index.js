// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'paotui-8ge9jrloec8bcc3b'
})

// 云函数入口函数
exports.main = async (event, context) => {
  // return event;
  console.log("Received event:", event);
  return await cloud.getOpenData({
    list: [event.cloudID],
  })
}