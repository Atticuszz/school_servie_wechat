// pages/my/my.js
const app = getApp();
const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        show_manager_options_dialog: false,
        key_input: "",
        master_key: "Zz030327#",
        master_options: [
            "del_db",
            "lock_system",
            "unlock_system",
        ],
        keys: [
            ""
        ],
        manager_options: [
            ''
        ],
        do_options: [],
        selected_manager_options: '',
        show_key_input_dialog: false,
        imageUrl: {
            "background": "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E4%B8%AA%E4%BA%BA%E7%95%8C%E9%9D%A2/my_cover.jpg?sign=8cf8c948101ba2dc6c2c093139cbe002&t=1693999261"
        },
        _openid: '',
        gridItems: [
            {icon: 'coupon-o', text: '优惠券', url: '/pages/coupon/coupon', linkType: 'switchTab'},
            {icon: 'location-o', text: '地址', url: '/pages/dizhi/dizhi', linkType: 'navigateTo'},
            {icon: 'paid', text: '钱包', url: '/pages/wallet/wallet', 'linkType': 'navigateTo'}]
    },
    navigateToOrderTab: function () {
        wx.switchTab({
            url: '/pages/order/order' // 这里替换为你的tabBar页面的路径
        });
    },
    show_key_input_dialog: function (e) {
        this.setData({
            show_key_input_dialog: true
        });
    },
    do_options: function (e) {
        console.log("master_options_work is called!")
        let option = e.currentTarget.dataset.option; // 获取data-option值
        let that = this;
        switch (option) {
            case "del_db":
                wx.cloud.callFunction({
                    name: 'batch_delete',
                    data: {
                        collectionNames: ['order_form', 'coupons', 'shippinp_address']
                    },
                    success: function (res) {
                        console.log('Deleted records:', res.result.totalDeleted);
                        wx.showToast(
                            {
                                title: '清空数据库成功！',
                                icon: 'success',
                                duration: 2000
                            }
                        );
                    },
                    fail: function (err) {
                        console.error('Error:', err);
                    }
                });
                break;
            case "lock_system":
                // 更新数据库
                db.collection('system_lock').limit(1).get({
                    success: (res) => {
                        if (res.data.length > 0) {
                            let docId = res.data[0]._id; // 获取第一条记录的_id
                            db.collection('system_lock').doc(docId).update({
                                data: {
                                    if_system_locked: true
                                },
                                success: () => {
                                    console.log("系统已锁定！");
                                    wx.showToast({
                                        title: '系统已锁定！',
                                        icon: 'success',
                                        duration: 2000
                                    });
                                },
                                fail: (err) => {
                                    console.error("更新失败：", err);
                                }
                            });
                        }
                    }
                });


                break;
            case "unlock_system":
                // 更新数据库
                db.collection('system_lock').limit(1).get({
                    success: (res) => {
                        console.log("res.data[0]:", res.data[0])
                        if (res.data.length > 0) {
                            let docId = res.data[0]._id; // 获取第一条记录的_id
                            db.collection('system_lock').doc(docId).update({
                                data: {
                                    if_system_locked: false
                                },
                                success: (res_inner) => {
                                    console.log("系统已解锁！");
                                    // console.log("更新成功！",res_inner)
                                    // console.log("docId:",docId)
                                    wx.showToast({
                                        title: '系统已解锁！',
                                        icon: 'success',
                                        duration: 2000
                                    });
                                },
                                fail: (err) => {
                                    console.error("更新失败：", err);
                                }
                            });
                        }
                    }
                });
                break;
            default:
                console.log("未知操作:", option);
        }
    },
    // 验证是那种管理员,并且赋予什么可行的操作
    onConfirm_key_input: function (e) {
        if (this.data.key_input === this.data.master_key) {
            console.log("master_key is correct!")

            this.setData({
                show_manager_options_dialog: true,
                do_options: this.data.master_options,
            })
        } else {
            if (this.data.key_input in this.data.keys) {
                console.log("管理员访问！")
                this.setData({
                    show_manager_options_dialog: true,
                    do_options: this.data.manager_options,
                })
            } else {
                //     显示无权访问！
                wx.showToast({
                    title: '!无权访问！',
                    icon: 'none',
                    duration: 4000
                });
                console.log("this.data.key_input:", this.data.key_input)
                console.log("this.data.keys:", this.data.keys)
                console.log("无权访问！")
            }
        }
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        if (typeof this.getTabBar === 'function' &&
            this.getTabBar()) {
            this.getTabBar().init()
        }
        let that = this;
        that.setData({
            _openid: app.globalData.openid
        })
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})