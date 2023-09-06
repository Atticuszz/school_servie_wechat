// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'school2service-0gp1dcf9a73528f4'
})

const db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
 
    return await  db.collection('order').aggregate()
      .match(event.obj)
      .lookup({
        from: 'publish',
        localField: 'publish_id',
        foreignField: '_id',
        as: 'List',
      })
      .limit(20)
      .skip(event.skip)
      .sort({
          creat:-1,
      })
      .end()
      .then(res => {
            console.log(res)
            return res;
      })
      
      .catch(err => console.error(err))
 
}