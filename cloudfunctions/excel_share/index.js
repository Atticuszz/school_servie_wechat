// 云函数入口文件
const cloud = require('wx-server-sdk')
const xlsx = require('node-xlsx');
cloud.init({
    env: 'school2service-0gp1dcf9a73528f4'
})

exports.main = async (event, context) => {
    const {csvData, deliveryTime} = event;

    // 使用node-xlsx库将CSV数据转换为Excel格式
    const buffer = xlsx.build([{name: "Orders", data: csvData}]);

    // 将Excel文件保存到云存储，并使用deliveryTime作为文件名的一部分
    const cloudPath = `excelFiles/orders_${deliveryTime}.xlsx`;
    const fileStream = Buffer.from(buffer);

    const uploadResult = await cloud.uploadFile({
        cloudPath: cloudPath,
        fileContent: fileStream,
    });

    // 返回文件的URL
    return uploadResult.fileID;
};
