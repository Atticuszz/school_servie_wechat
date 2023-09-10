// pages/handle_orders/handle_orders.js
const db = wx.cloud.database();
const app = getApp();
// 递归拉取指定delivery_time的所有数据
const fetchAllDataForDay = (deliveryTime, fetchedDataForDay = [], skip = 0) => {
    return new Promise((resolve, reject) => {
        db.collection('order_form')
            .where({
                delivery_time: deliveryTime
            })
            .limit(20)
            .skip(skip)
            .get()
            .then(res => {
                const data = res.data;
                fetchedDataForDay = fetchedDataForDay.concat(data);

                // 如果拉取的数据数量为20，可能还有更多数据，继续拉取
                if (data.length === 20 && data.length>0) {
                    resolve(fetchAllDataForDay(deliveryTime, fetchedDataForDay, skip + 20));
                } else {
                    resolve(fetchedDataForDay);
                }
            })
            .catch(err => {
                reject(err);
            });
    });
};

Page({

    /**
     * 页面的初始数据
     */
    data: {
        show_notification_dialog: false,
        orders: [],
        dormitory: [],
        delivery_time: null,
        dormitoryStatus: [],
        dormitory_info: null,
    },


    // 导入需要的库


// 随机选择函数
    randomChoice: function (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

// 随机生成11位手机号
    generatePhone: function () {
        return '1' + (Math.floor(Math.random() * 9) + 1) + Math.random().toString().slice(2, 11);
    },

// 生成不重复的取件码
    generatePickUpCode: function () {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    },

    add_multiple_test_order_form: function (num) {
        console.log(`开始提交${num}个测试数据到数据库`);

        let count = 0; // 用于跟踪已添加的内容数量
        const dormitory_list = ['成园1幢', '成园2幢', '成园3幢', '成园4幢', '成园5幢', '成园6幢', '桃园1幢', '桃园2幢', '桃园3幢', '桃园4幢', '桃园5幢', '桃园6幢', '桃园7幢', '桃园8幢', '桃园9幢', '桃园10幢', '桃园11幢', '桃园12幢', '桃园13幢', '桃园14幢', '桃园15幢', '桃园16幢', '桃园17幢', '桃园18幢']
        for (let i = 0; i < num; i++) {
            let selected_site_data = this.randomChoice(app.globalData.express_site_list);
            let delivery_period = this.randomChoice(["中午", "晚上"]);
            let recipient = "测试用户" + Math.floor(Math.random() * 1000); //随机生成测试用户名
            let dormitory = this.randomChoice(dormitory_list);
            let phone = this.generatePhone();
            let pick_up_code = this.generatePickUpCode();
            let selectedExpressSize = this.randomChoice(["小的", "中的", "大的", "超大的"]);
            let remarks = "测试留言" + Math.random().toString(36).substr(2, 5);
            let cost = this.randomChoice([2, 4, 6, 8]);
            let created_time = new Date().getTime();

            db.collection('order_form').add({
                data: {
                    category: 'pick_up',
                    selected_site: selected_site_data.title,
                    express_site_index: selected_site_data.express_site_index,
                    delivery_period: delivery_period,
                    recipient: recipient,
                    dormitory: dormitory,
                    phone: phone,
                    pick_up_code: pick_up_code,
                    selectedExpressSize: selectedExpressSize,
                    remarks: remarks,
                    order_state: false,
                    delivery_time: "None",
                    cost: cost,
                    created_time: created_time
                },
                success: function (res) {
                    count += 1;
                    console.log(`第${count}个测试订单成功提交到数据库!`);
                },
                fail: function (er) {
                    wx.showToast({
                        title: `提交第${count + 1}个测试数据失败`,
                        icon: 'none',
                        duration: 4500
                    });
                }
            });
        }
    },

    create_test_orders() {
        this.add_multiple_test_order_form(20);
    },
    clean_orders() {
        wx.cloud.callFunction({
            name: 'batch_delete',
            data: {
                collectionNames: ['order_form',]
            },
            success: function (res) {
                console.log('Deleted records:', res.result.totalDeleted);
                wx.showToast(
                    {
                        title: '清空order_form成功！',
                        icon: 'success',
                        duration: 2000
                    }
                );
            },
            fail: function (err) {
                console.error('Error:', err);
            }
        });
    },
    fetch_today: function (event) {
        let that  = this;
        console.log("fetch_today is called")
        let slot = event.currentTarget.dataset.slot; // 这将得到 "0"/"1"
        console.log("slot:", slot);
        // 获取当前日期
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        // const formattedDate = "2023-9-7"
        const delivery_time = `${formattedDate}-${slot}`;
        console.log("delivery_time:", delivery_time);

        let allData = []; // 存储所有拉取的数据

        const fetchPageData = (skip = 0) => {
            db.collection('order_form')
                .where({
                    // 获取delivery_time为"None"或当天日期+配送时段的数据
                    delivery_time: db.command.or(["None", delivery_time])
                })
                .limit(20) // 每次拉取20条数据
                .skip(skip) // 跳过已拉取的数据
                .get()
                .then(res => {
                    let data = res.data;
                    allData = allData.concat(data);

                    // 如果拉取的数据数量为20，可能还有更多数据，继续拉取
                    if (data.length >0 && data.length === 20) {
                        fetchPageData(skip + 20);
                    } else {
                        processData(allData);
                        that.fetch_last_week();
                    }
                })
                .catch(err => {
                    console.error("查询数据库时发生错误：", err);
                });
        };

        const processData = (data) => {
            // 修改delivery_time为当天日期+配送时段
            for (let i = 0; i < data.length; i++) {
                db.collection('order_form').doc(data[i]._id).update({
                    data: {
                        delivery_time: delivery_time
                    },
                    success: function () {
                        console.log(`第${i + 1}个数据成功更新!`);
                    },
                    fail: function (err) {
                        console.error(`第${i + 1}个数据更新失败:`, err);
                    }
                });
            }

            // 按照取件码排序
            data.sort((a, b) => a.pick_up_code - b.pick_up_code);

            // 按照快递驿站排序
            data.sort((a, b) => a.express_site_index - b.express_site_index);

            // 控制台打印排序后的数据
            console.log("data:", data);
        };

        fetchPageData();
        console.log("fetch_toady is end");
    },
    fetch_last_week: function () {
        wx.showToast(
            {
                title: '正在查询',
                icon: 'loading',
                duration: 10000
            }
        )
        console.log("fetch_last_week is called");
        const today = new Date();
        const days = [];
        // 获取过去7天日期
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            days.push(formattedDate);
        }
        // console.log("days:",days)
        // console.log("`${day}-0`:",`${days[0]}-0`)
        let fetchedOrders = [];

        const fetchOrdersForDays = (index = 0) => {
            if (index >= days.length) {
                this.setData({
                    orders: fetchedOrders
                });
                console.log("fetch_last_week orders:", fetchedOrders)
                console.log("fetch_last_week is end");
                wx.showToast(
                    {
                        title: '查询完成',
                        icon: 'success',
                        duration: 2500
                    }
                )
                return;
            }

            const day = days[index];

            // 为当天的两个时间段（-0 和 -1）拉取数据
            Promise.all([fetchAllDataForDay(`${day}-0`), fetchAllDataForDay(`${day}-1`)])
                .then(([dataForDay0, dataForDay1]) => {
                    if (dataForDay0.length > 0) {
                        const ordersForDay0 = {
                            delivery_time: day + "-0",
                            detail: dataForDay0
                        };
                        // console.log(index,"th,ordersForDay0", ordersForDay0);
                        fetchedOrders.push(ordersForDay0);
                    }
                    if (dataForDay1.length > 0) {
                        const ordersForDay1 = {
                            delivery_time: day + '-1',
                            detail: dataForDay1
                        };
                        // console.log(index,"th,ordersForDay0", ordersForDay1);
                        fetchedOrders.push(ordersForDay1);
                    }
                    fetchOrdersForDays(index + 1);
                })
                .catch(err => {
                    console.error(`获取${day}的订单时发生错误：`, err);
                });
        };

        fetchOrdersForDays();


    },
    fetch_orders: function (event) {
        this.fetch_today(event);

    },
    export_orders: function (event) {
        const delivery_time = event.currentTarget.dataset.delivery_time;
        // console.log("event.currentTarget.dataset:",event.currentTarget.dataset)
        console.log("delivery_time:", delivery_time)
        const ordersForDay = this.data.orders.find(order => order.delivery_time === delivery_time);
        console.log("ordersForDay:", ordersForDay);

        wx.cloud.callFunction({
            name: 'excel_share',
            data: {
                csvData: this.convertToCSV(ordersForDay.detail), // 传递你的数据
                deliveryTime: delivery_time
            }
            ,
            success: res => {
                // 返回的res.result应该是Excel文件的URL
                const fileURL = res.result;
                console.log("fileURL:", fileURL)
                // 提示用户或直接打开链接
                wx.showModal({
                    title: 'Excel已生成',
                    content: '点击确定下载',
                    success(res) {
                        console.log("Excel已生成res")
                        if (res.confirm) {
                            console.log('用户点击确定')
                            // 使用wx.downloadFile或其他方法下载文件
                            wx.cloud.downloadFile({
                                fileID: fileURL, // 这里的 fileURL 实际上是云存储中的 fileID
                                success: function (res) {
                                    console.log("下载成功");
                                    // 保存文件到系统相册。用户可以在文件管理器中打开。
                                    // 注意: 因为你下载的是Excel文件, 所以不能使用saveImageToPhotosAlbum
                                    // 你可以使用其他方法来保存或打开文件，如wx.openDocument
                                    wx.openDocument({
                                        filePath: res.tempFilePath,
                                        fileType: 'xlsx',
                                        showMenu: true,
                                        success: function (res) {
                                            console.log('打开Excel文件成功');
                                        },
                                        fail: err => {
                                            console.error("打开Excel文件失败：", err);
                                        }
                                    });
                                },
                                fail: err => {
                                    console.error("下载失败：", err);
                                }
                            });
                        }
                    }
                });
            },
            fail: err => {
                console.error("导出Excel失败：", err);
            }
        });

    },
    convertToCSV: function (data) {
        // headers
        const headers = ["Selected Site", "Pick Up Code", "Dormitory", "Express Size", "Recipient", "Phone", "Remarks"];

        const csvData = [];

        csvData.push(headers);  // 添加表头
        data.sort((a, b) => a.pick_up_code - b.pick_up_code);
        data.sort((a, b) => a.express_site_index - b.express_site_index);
        console.log("data:", data);
        data.forEach(order => {
            const row = [
                order.selected_site,
                order.pick_up_code,
                order.dormitory,
                order.selectedExpressSize,
                order.recipient,
                order.phone,
                order.remarks
            ];
            csvData.push(row);  // 添加每行数据
        });


        console.log("csvData:", csvData);
        return csvData;
    },
    extractInfo: function (dormitory) {
        let chinesePart = dormitory.match(/[^\d]+/)[0]; // 提取汉字部分
        let numberPart = parseInt(dormitory.match(/\d+/)[0], 10); // 提取数字部分
        return {chinesePart, numberPart};
    },

    show_notification_dialog(event) {
        const delivery_info = event.currentTarget.dataset.delivery_info;
        console.log("delivery_info:", delivery_info);
        let allDormitories = delivery_info.detail.map(order => order.dormitory);
        // 使用reduce和map方法获取所有宿舍

// 使用Set去除重复项
        let uniqueDormitories = [...new Set(allDormitories)];
        uniqueDormitories.sort((a, b) => {
            // 从宿舍名称中提取数字
            const numberA = parseInt(a.match(/\d+/)[0], 10);
            const numberB = parseInt(b.match(/\d+/)[0], 10);
            return numberA - numberB; // 根据数字进行排序
        });

        let dataDetail = delivery_info.detail;

        let dormitory_info = [];

        uniqueDormitories.forEach(dormitory => {
                // 获取特定宿舍的所有订单
                const ordersForDormitory = dataDetail.filter(order => order.dormitory === dormitory);
                let temp = {
                    "dormitory": dormitory,
                    "order_state": ordersForDormitory.every(order => order.order_state === true)
                };
                dormitory_info.push(temp);
            }
        );
        dormitory_info.sort((a, b) => {
            const infoA = this.extractInfo(a.dormitory);
            const infoB = this.extractInfo(b.dormitory);

            // 首先根据汉字排序
            if (infoA.chinesePart < infoB.chinesePart) return -1;
            if (infoA.chinesePart > infoB.chinesePart) return 1;

            // 汉字相同则根据数字排序
            return infoA.numberPart - infoB.numberPart;
        });

        // console.log("uniqueDormitories:", uniqueDormitories); // 输出不同的宿舍种类
        console.log("dormitory_info:", dormitory_info); // 输出每个宿舍的订单状态
        this.setData({
            show_notification_dialog: true,
            delivery_time: delivery_info.delivery_time,
            dormitory_info
        })
    },
    handleCellTap: function (event) {
        let that = this;
        const dormitoryItem = event.currentTarget.dataset.dormitory;
        const deliveryTime = this.data.delivery_time;
        wx.showToast(
            {
                title: '通知' + dormitoryItem + "中",
                icon: 'loading',
                duration: 10000
            }
        )
        // 查询并更新数据库
        db.collection('order_form')
            .where({
                dormitory: dormitoryItem,
                delivery_time: deliveryTime
            })
            .update({
                data: {
                    order_state: true
                },
                success: function (res) {
                    console.log(`成功更新了${res.stats.updated}条记录`);
                    wx.showToast(
                        {
                            title: '通知成功',
                            icon: 'success',
                            duration: 3000
                        }
                    )
                    that.setData({
                        show_notification_dialog: false
                    })
                    that.fetch_last_week();
                },
                fail: function (err) {
                    console.error("更新数据库时发生错误：", err);
                }
            });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // console.log("handle_orders_onLoad");
        this.fetch_last_week();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // console.log("handle_orders_onShow");
        this.fetch_last_week()
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        this.fetch_last_week();
        wx.stopPullDownRefresh();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})