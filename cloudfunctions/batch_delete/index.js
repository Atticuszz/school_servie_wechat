const cloud = require('wx-server-sdk')

cloud.init({
    env: 'school2service-0gp1dcf9a73528f4'
})

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
    const collectionNames = event.collectionNames;  // 从调用云函数时传入的集合名称数组

    let totalDeleted = 0;

    for (const collectionName of collectionNames) {
        // 获取集合中所有记录的 _id
        const totalResult = await db.collection(collectionName).count();
        const total = totalResult.total;
        const batchTimes = Math.ceil(total / 100);

        for (let i = 0; i < batchTimes; i++) {
            const batchData = await db.collection(collectionName).skip(i * 100).limit(100).get();
            const idsToDelete = batchData.data.map(item => item._id);

            // 删除这批数据
            await db.collection(collectionName).where({
                _id: _.in(idsToDelete)
            }).remove();

            totalDeleted += idsToDelete.length;
        }
    }

    return {
        message: 'Batch delete completed',
        totalDeleted: totalDeleted
    };
}
