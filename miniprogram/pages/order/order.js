// pages/publish/publish.js
const app = getApp();
const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        delivery_sites: [],
        //状态条
        state_steps: [
            {text: '提交订单'},
            {text: '配送中'},
            {text: '已到货'}
        ],
        // 订单卡片信息
        tab: '全部',
        orders: [{
            "thumb": '',
            "title": '',
            "order_price": 0,
            "address": {
                "delivery_period": '',
                "recipient": '',
                "dormitory": '',
                "phone": ''
            },
            "pick_up_code": '',
            "created_time": '',
            "cost": 0,
            "selectedExpressSize": '',
            "order_state_step": 0 // 默认设置为第一步
        }],

        // express_site_index->商品信息 thumb,selectedExpressSize,title,数量,order_price
        // pick_up_code
        // address ->delivery_period,recipient,dormitory,phone
        // created_time
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        app.check_locked();
        // 模拟从 CMS 或其他后端服务获取数据
        this.initDeliverySites();
        this.init_orders();
    },
    initDeliverySites: function () {
        const express_site_list = [
            {
                "desc": "中通,极兔,申通,京东,丹鸟",
                "thumb": "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%BF%AB%E9%80%92%E7%AB%99%E7%82%B9/%E8%8F%9C%E9%B8%9F%E9%A9%BF%E7%AB%99.jpg?sign=cd69487f3cbcc45c6a358ebbba5822e5&t=1693985078",
                "title": "菜鸟驿站(校内)",
                "express_site_index": 0
            },
            {
                "desc": "顺丰,韵达,天猫: 泰来苑98幢",
                "express_site_index": 1,
                "thumb": "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%BF%AB%E9%80%92%E7%AB%99%E7%82%B9/%E9%A9%BF%E6%94%B6%E5%8F%91%E9%A9%BF%E7%AB%99.png?sign=0014d18abfbd7e37217695e56a8507e3&t=1693985060",
                "title": "驿收发驿站(校外)",
            },
            {
                "desc": "圆通速递'",
                "express_site_index": 2,
                "thumb": "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%BF%AB%E9%80%92%E7%AB%99%E7%82%B9/%E5%9C%86%E9%80%9A.png?sign=d1935afb29a8eaf2716d83dd29cec913&t=1693985018",
                "title": "妈妈驿站(校外)",
            },
            {
                "desc": "下午四点关门,快递柜24小时",
                "express_site_index": 3,
                "thumb": "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%BF%AB%E9%80%92%E7%AB%99%E7%82%B9/%E9%82%AE%E6%94%BF.png?sign=3743dcba1ecdb0cad43fba9287ee6974&t=1693985037",
                "title": "中国邮政(校内)",
            }
        ]
        this.setData({
            delivery_sites: express_site_list
        });

        // console.log("delivery_sites:", this.data.delivery_sites)
    },
    init_orders: function () {
        db.collection('order_form')
            .where({_openid: app.globalData.openid})
            .orderBy('created_time', 'desc') // 按照created_time降序排序
            .limit(20)  // 最多获取20条数据
            .get()
            .then(res => {
                const fetchedOrders = res.data;
                console.log("fetchedOrders:", fetchedOrders);
                const orders = fetchedOrders.map(item => {
                    // 查找与 express_site_index 匹配的 thumb
                    const matchingSite = this.data.delivery_sites.find(site => site.express_site_index === item.express_site_index);
                    const thumb = matchingSite ? matchingSite.thumb : 'default_thumb.jpg';  // 如果没有找到，使用一个默认的 thumb

                    return {
                        order_state_step: item.order_state ? 2 : 1,
                        thumb,
                        title: item.selected_site,
                        selectedExpressSize: item.selectedExpressSize,
                        pick_up_code: item.pick_up_code,
                        cost: item.cost,
                        address: {
                            delivery_period: item.delivery_period,
                            recipient: item.recipient,
                            dormitory: item.dormitory,
                            phone: item.phone,
                        },
                        created_time: this.formatDate(item.created_time),
                    };
                });

                this.setData({
                    orders,
                });

                console.log("订单查询结果:", orders);
            })
            .catch(err => {
                console.error("查询失败:", err);
            });
    },

    formatDate: function (unixTimestamp) {
        const date = new Date(unixTimestamp);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    },
    //监听切换导航的变化
    onChange(event) {

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
        app.check_locked();
        if (typeof this.getTabBar === 'function' &&
            this.getTabBar()) {
            this.getTabBar().init()
        }
        this.init_orders();

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