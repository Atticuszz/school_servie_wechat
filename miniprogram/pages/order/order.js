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
        list: [
            {
                _id: "order_1",
                category: 1,  // 接单中
                cost: 50,
                creat: new Date().getTime(),
                List: [
                    {
                        _id: "list_1",
                        category: "帮我买",
                        notes: "请购买牛奶和面包",
                        mai_location: "超市",
                        end_location: "XX小区",
                        phone: "123456789"
                    }
                ]
            },
            {
                _id: "order_2",
                category: 2,  // 已完成
                cost: 30,
                creat: new Date().getTime() - 86400000, // 假设是1天前的订单
                List: [
                    {
                        _id: "list_2",
                        category: "帮我买",
                        notes: "请购买纸巾",
                        mai_location: "请选择购买地点",
                        end_location: "YY小区",
                        phone: "987654321"
                    }
                ]
            },
            {
                _id: "order_1",
                category: 1,  // 接单中
                cost: 50,
                creat: new Date().getTime(),
                List: [
                    {
                        _id: "list_1",
                        category: "帮我买",
                        notes: "请购买牛奶和面包",
                        mai_location: "超市",
                        end_location: "XX小区",
                        phone: "123456789"
                    }
                ]
            },
            {
                _id: "order_1",
                category: 1,  // 接单中
                cost: 50,
                creat: new Date().getTime(),
                List: [
                    {
                        _id: "list_1",
                        category: "帮我买",
                        notes: "请购买牛奶和面包",
                        mai_location: "超市",
                        end_location: "XX小区",
                        phone: "123456789"
                    }
                ]
            },
            {
                _id: "order_1",
                category: 1,  // 接单中
                cost: 50,
                creat: new Date().getTime(),
                List: [
                    {
                        _id: "list_1",
                        category: "帮我买",
                        notes: "请购买牛奶和面包",
                        mai_location: "超市",
                        end_location: "XX小区",
                        phone: "123456789"
                    }
                ]
            },
            {
                _id: "order_1",
                category: 1,  // 接单中
                cost: 50,
                creat: new Date().getTime(),
                List: [
                    {
                        _id: "list_1",
                        category: "帮我买",
                        notes: "请购买牛奶和面包",
                        mai_location: "超市",
                        end_location: "XX小区",
                        phone: "123456789"
                    }
                ]
            },
        ],
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
        nomore: false,
        page: 0,

        anniu_show: -1,     //做按钮显示限制，防止用户多次点击单个按钮
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
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
    //联系客户
    call_phone: function (event) {
        let that = this;
        that.setData({
            anniu_show: event.currentTarget.dataset.anniu_show,
        })

        console.log(event)
        let phone = event.currentTarget.dataset.phone
        wx.makePhoneCall({
            phoneNumber: phone,
        })
        that.setData({
            anniu_show: true,
        })
    },
    //删除订单
    delete_order: function (event) {
        let that = this;
        that.setData({
            anniu_show: event.currentTarget.dataset.anniu_show,
        })
        wx.showLoading({
            title: '正在删除',
        })
        let id = event.currentTarget.dataset.id
        db.collection('order').doc(id).remove({
            success: function (res) {

                that.shuju();
                wx.hideLoading()
                wx.showToast({
                    title: '删除成功',
                    icon: 'success',
                    duration: 2000
                })
                that.setData({
                    anniu_show: true,
                })

            },
            fail(er) {
                wx.hideLoading()
                wx.showToast({
                    title: '删除失败，请重试',
                    icon: 'none',
                    duration: 2000
                })
                that.setData({
                    anniu_show: true,
                })

            }
        })
    },
    //催客户确认送达
    cui_kehu: function (event) {
        let that = this;
        that.setData({
            anniu_show: event.currentTarget.dataset.anniu_show,
        })
        console.log(event)
        let ke_phone = event.currentTarget.dataset.phone
        let order_id = event.currentTarget.dataset.order_id
        wx.cloud.callFunction({
            name: 'cui_kehu',
            data: {
                order_id: order_id,
                ke_phone: ke_phone,
            },
            success: function (res) {
                if (res.result.success) {

                    //成功后，要重新获取新数据，
                    that.shuju();
                    wx.hideLoading()
                    wx.showToast({
                        title: '操作成功',
                        icon: 'success',
                        duration: 2000
                    })
                    that.setData({
                        anniu_show: true,
                    })

                }
                if (!res.result.success) {
                    wx.hideLoading()
                    wx.showToast({
                        title: '失败，请重试',
                        icon: 'none',
                        duration: 2000
                    })
                    that.setData({
                        anniu_show: true,
                    })
                }
            },
            fail(er) {
                wx.hideLoading()
                wx.showToast({
                    title: '失败，请重试',
                    icon: 'none',
                    duration: 2000
                })
                that.setData({
                    anniu_show: true,
                })
            }
        })
    },
    //监听切换导航的变化
    onChange(event) {
        console.log(event.detail.title)
        let that = this;
        //每次切换，都要把page归零，不然到第二个导航标获取更多数据的时候，会跳过很多东西
        that.setData({
            tab: event.detail.title,
            page: 0,
        })
        that.shuju();

    },
    //获取更多数据
    gengduo: function () {
        let that = this;
        if (that.data.nomore || that.data.list.length < 20) {
            wx.showToast({
                title: '没有更多了',
            })
            return false
        }
        if (that.data.tab == '全部') {
            let page = that.data.page + 1;
            let obj = {
                _openid: app.globalData.openid,
            }
            let skip = page * 20;
            wx.cloud.callFunction({
                name: 'order_lookup',
                data: {
                    obj: obj,
                    skip: skip,
                },
                success: function (res) {
                    console.log(res)
                    if (res.data.length == 0) {
                        that.setData({
                            nomore: true
                        })
                        return false;
                    }
                    if (res.data.length < 20) {
                        that.setData({
                            nomore: true
                        })
                    }
                    //取到成功后，都连接到旧数组，然后组成新数组
                    that.setData({
                        //这里的page为1，
                        page: page,
                        list: that.data.list.concat(res.data)
                    })
                },
                fail(er) {
                    console.log(er)
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })

        }
        if (that.data.tab == '接单中') {
            let page = that.data.page + 1;
            let obj = {
                _openid: app.globalData.openid,
                category: 1,
            }
            let skip = page * 20;
            wx.cloud.callFunction({
                name: 'order_lookup',
                data: {
                    obj: obj,
                    skip: skip,
                },
                success: function (res) {
                    console.log(res)
                    if (res.data.length == 0) {
                        that.setData({
                            nomore: true
                        })
                        return false;
                    }
                    if (res.data.length < 20) {
                        that.setData({
                            nomore: true
                        })
                    }
                    //取到成功后，都连接到旧数组，然后组成新数组
                    that.setData({
                        //这里的page为1，
                        page: page,
                        list: that.data.list.concat(res.data)
                    })
                },
                fail(er) {
                    console.log(er)
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
        if (that.data.tab == '待确认') {
            let page = that.data.page + 1;
            let obj = {
                _openid: app.globalData.openid,
                category: 4,
            }
            let skip = page * 20;
            wx.cloud.callFunction({
                name: 'order_lookup',
                data: {
                    obj: obj,
                    skip: skip,
                },
                success: function (res) {
                    console.log(res)
                    if (res.data.length == 0) {
                        that.setData({
                            nomore: true
                        })
                        return false;
                    }
                    if (res.data.length < 20) {
                        that.setData({
                            nomore: true
                        })
                    }
                    //取到成功后，都连接到旧数组，然后组成新数组
                    that.setData({
                        //这里的page为1，
                        page: page,
                        list: that.data.list.concat(res.data)
                    })
                },
                fail(er) {
                    console.log(er)
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
        if (that.data.tab == '已完成') {
            let page = that.data.page + 1;
            let obj = {
                _openid: app.globalData.openid,
                category: 2,
            }
            let skip = page * 20;
            wx.cloud.callFunction({
                name: 'order_lookup',
                data: {
                    obj: obj,
                    skip: skip,
                },
                success: function (res) {
                    console.log(res)
                    if (res.data.length == 0) {
                        that.setData({
                            nomore: true
                        })
                        return false;
                    }
                    if (res.data.length < 20) {
                        that.setData({
                            nomore: true
                        })
                    }
                    //取到成功后，都连接到旧数组，然后组成新数组
                    that.setData({
                        //这里的page为1，
                        page: page,
                        list: that.data.list.concat(res.data)
                    })
                },
                fail(er) {
                    console.log(er)
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
        if (that.data.tab == '已转单') {
            let page = that.data.page + 1;
            let obj = {
                _openid: app.globalData.openid,
                category: 3,
            }
            let skip = page * 20;
            wx.cloud.callFunction({
                name: 'order_lookup',
                data: {
                    obj: obj,
                    skip: skip,
                },
                success: function (res) {
                    console.log(res)
                    if (res.data.length == 0) {
                        that.setData({
                            nomore: true
                        })
                        return false;
                    }
                    if (res.data.length < 20) {
                        that.setData({
                            nomore: true
                        })
                    }
                    //取到成功后，都连接到旧数组，然后组成新数组
                    that.setData({
                        //这里的page为1，
                        page: page,
                        list: that.data.list.concat(res.data)
                    })
                },
                fail(er) {
                    console.log(er)
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
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
        let that = this;
        that.setData({
            anniu_show: -1,
        })
        that.shuju();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        //触底了就触发gengduo函数，去获取更多数据
        this.gengduo();
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})