// pages/qu/qu.js

const app = getApp();
const db = wx.cloud.database();
import Toast from '@vant/weapp/toast/toast';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        submit_loading: false,
        show_delivery_sites: false,  // 控制弹窗显示
        showActionSheet: false,

        selected_site: null,  // 记录选中的快递站点
        express_site_index: -1,
        delivery_sites: app.globalData.express_site_list,
        selectedExpressSize: "",
        select_express_size_actions: [
            {
                name: '小的',
                subname: '你能随手拿的小东西们',
                value: 0
            },
            {
                name: '中的',
                subname: '得物鞋盒那么大的',
                value: 1
            },
            {
                name: '大的',
                subname: '你抱着有点累的',
                value: 2
            },
            {
                name: "超大的",
                subname: "电竞椅那种超大的家伙",
                value: 3
            },
            {
                name: "test",
                subname: "test",
                value: 4
            }
        ],
        express_size: -1,
        pick_up_code: '',  //取件码或者快递单号
        remarks: '',  //用户评论
        final_cost: 999,
        prices: [2, 4, 8, 12, 999],

        // 地址信息
        address: {},

        // 优惠券
        selected_coupon: null,

    },
    // 选择快递站点
    selectDeliverySite(e) {
        const index = e.currentTarget.dataset.index;
        const selected_site = this.data.delivery_sites[index];

        this.setData({
            selected_site,
            show_delivery_sites: false,  // 关闭弹窗
            express_site_index: index,

        });
        app.globalData.selected_site = selected_site;
        app.globalData.selected_site_index = index;
        console.log("选择了：", this.data.selected_site)
        // 这里你可以进一步处理 selected_site，比如存储或发送给服务器
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {

    },
    // 加载个人地址

    // 选择快递站点
    showDialog() {
        this.setData({
            show_delivery_sites: true
        });

        console.log("弹出快递站点选择框")
    },
    showActionSheet() {
        this.setData({
            showActionSheet: true
        });
        console.log("弹出选择快递大小窗口")
    },


    // 选择快递大小
    onSelectAction(event) {
        const {value} = event.detail;
        const selected = this.data.select_express_size_actions[value].name;
        // 直接从数组中获取名称
        const price = this.data.prices[value];
        this.setData({
            final_cost: app.globalData.coupon.discount * price,
            showActionSheet: false,
            selectedExpressSize: selected,
            express_size: value,
        });
        app.globalData.selectedExpressSizeIndex = value;
        app.globalData.selectedExpressSize = selected;
        console.log("express_size:", this.data.express_size);
        console.log("selectedExpressSize=", this.data.selectedExpressSize);
    },

    //获取钱包余额
    get_balance: function () {
        let that = this;
        db.collection('user').where({
            _openid: app.globalData.openid,
        }).get({
            success: function (res) {
                //用户不存在于user表里，则添加
                if (res.data.length == 0) {
                    db.collection('user').add({
                        data: {
                            balance: 0,
                        },
                        success: function (r) {
                            console.log('添加balance字段成功')
                            //成功添加，不做任何处理

                        },
                        fail() {
                            // 不成功，就退出此页面，防止使用钱包支付时候出错
                            wx.showToast({
                                title: '发送错误，请重试',
                                icon: 'none',
                                duration: 2000
                            })
                            setTimeout(function () {
                                wx.navigateBack({
                                    delta: 0,
                                })
                            }, 1000)
                        }
                    })
                }
                //用户存在于user表里
                if (res.data.length !== 0) {
                    console.log(res.data[0].balance)
                    that.setData({
                        balance: res.data[0].balance,
                        user_id: res.data[0]._id,
                    })
                }
            }
        })
    },
    //跳转充值页面
    go_parse: function () {
        let that = this;
        wx.navigateTo({
            url: '/pages/recharge/recharge',
        })
    },

    //取件码或者快递单号
    onChange_pick_up_code: function (event) {
        let that = this;
        that.setData({
            pick_up_code: event.detail,
        })
        console.log(that.data.pick_up_code)
        app.globalData.pick_up_code = that.data.pick_up_code;
    },


    onChange_remarks: function (event) {
        let that = this;
        that.setData({
            remarks: event.detail,
        })
        console.log("remarks", that.data.remarks)
    },

    //是否使用余额支付
    onChange_userparse: function (event) {
        let that = this;
        console.log(event.detail)
        that.setData({
            user_parse: event.detail,
        })
    },
// 检查是否是纯数字
    isNumeric: function (str) {
        return /^[0-9]+$/.test(str);
    },

// 检查对象的每一个属性是否为空
    isEmpty: function (obj) {
        // 检查对象是否为null
        if (obj === null || obj === undefined) return true;


        // 检查对象是否为空（没有任何属性）
        if (Object.keys(obj).length === 0) return true;

        for (let key in obj) {
            if (obj[key] === '' || obj[key] === -1 || obj[key] === null) {
                return true;
            }

            // 如果属性的值是一个对象，递归检查它是否为空
            if (typeof obj[key] === 'object' && this.isEmpty(obj[key])) {
                return true;
            }
        }
        return false;
    },

    ////////////////
    //检查各个输入是否都已经输入
    onSubmit: function () {
        let that = this;
        that.setData({
            submit_loading: true
        })
        // 检查地址字段
        console.log("地址:", this.data.address)
        if (this.isEmpty(this.data.address)) {
            // wx.showToast({
            //     title: '收件信息是空的啊',
            //     icon: 'none',
            //     duration: 2000
            // });
            Toast.fail({
                message: '收件信息是空的啊',
                duration: 2500,
                forbidClick: true,
                context: that,
            })
            that.setData({
                submit_loading: false
            })
            return false;
        } else {
            console.log("地址:", this.data.address)
        }
        // // 检查取件码是否为纯数字
        // if (!this.isNumeric(this.data.pick_up_code)) {
        //     // wx.showToast({
        //     //     title: '取件码应该是纯数字',
        //     //     icon: 'none',
        //     //     duration: 2000
        //     // });
        //     Toast.fail({
        //         message: '取件码应该是纯数字',
        //         duration: 2500,
        //         forbidClick: true,
        //         context: that,
        //     })
        //     that.setData({
        //         submit_loading: false
        //     })
        //     return false;
        // }
        // 检查快递大小
        if (this.data.express_size === -1) {
            // wx.showToast({
            //     title: '快递规格忘了选吧',
            //     icon: 'none',
            //     duration: 2000
            // });
            Toast.fail({
                message: '快递规格忘了选吧',
                duration: 2500,
                forbidClick: true,
                context: that,
            })
            that.setData({
                submit_loading: false
            })
            return false;
        }
        if (that.data.selected_site == null) {
            // wx.showToast({
            //     title: '快递站点没告诉我',
            //     icon: 'none',
            //     duration: 2000
            // })
            Toast.fail({
                message: '快递站点没告诉我',
                duration: 2500,
                forbidClick: true,
                context: that,
            })
            that.setData({
                submit_loading: false
            })
            return false;
        }
        if (this.data.final_cost === 0) {
            let trade_no = Date.now().toString() + Math.floor(Math.random() * 1000).toString()
            this.add_order_form(trade_no);
            wx.requestSubscribeMessage({
                tmplIds: ["LKBC9IqOwtwKmzG7G2KSpvs_4dJ45_dSL0_5mum3SfM", "qAVo5ed6_mwB4D1WYVaI7xULItzxOUR8_-P5v_bgleg"],
                success(res) {
                    if (res["LKBC9IqOwtwKmzG7G2KSpvs_4dJ45_dSL0_5mum3SfM"] === 'accept') {
                        // 发送支付成功的订阅消息
                        that.sendPaySuccessNotification(trade_no);
                        console.log("用户同意了支付成功订阅消息");
                    }

                    if (res["qAVo5ed6_mwB4D1WYVaI7xULItzxOUR8_-P5v_bgleg"] === 'accept') {
                        // 发送订单送达的订阅消息
                        // 如果你想立即发送，可以在这里调用发送函数
                        // 或者你可以在适当的时机发送该消息
                        console.log("用户同意送达通知 了订阅消息");
                    }
                },
                fail(err) {
                    console.error("Failed to request permission:", err);
                    Toast.fail({
                        duration: 4500,
                        message: '订阅授权失败',
                        context: that,
                    })
                }
            });
            console.log("0$,支付成功")
        } else {
            this.pay();
        }
    },
    consume_coupon: function () {
        let that = this;
        if (this.data.selected_coupon == null) {
            console.log("this.data.selected_coupon == null")
            that.setData({
                submit_loading: false,
                selected_coupon: null,
            })
            // wx.showToast({
            //     title: '支付成功',
            //     icon: 'success',
            //     duration: 2000 // 持续时间为3秒
            // });
            Toast.success(
                {
                    message: '支付成功',
                    duration: 3000,
                    forbidClick: true,
                    context: that
                }
            )
            that.refresh_data()
            return false;
        }
        app.globalData.credits += this.data.final_cost * 100
        db.collection('coupons').where({
            _openid: app.globalData.openid // 替换为目标用户的 OpenID
        }).update({
            data: {
                'coupons': db.command.pull(this.data.selected_coupon),
                'credits': app.globalData.credits
            }
        }).then(res => {
            console.log('删除成功,添加积分成功', res);
            console.log("consume_coupon:", this.data.selected_coupon);
            console.log("old_credits:", app.globalData.credits - this.data.final_cost * 100);
            console.log("new_credits:", app.globalData.credits);
            app.globalData.coupon = {'discount': 1}
            that.setData({
                submit_loading: false,
                selected_coupon: null,

            })
            // wx.showToast({
            //     title: '提交订单成功',
            //     icon: 'success',
            //     duration: 2000 // 持续时间为3秒
            // });
            Toast.success(
                {
                    message: '提交订单成功',
                    duration: 3000, // 持续时间为3秒
                    context: that
                }
            )
            that.refresh_data();
        }).catch(err => {
            console.error('删除失败', err);
            console.log("consume_coupon:", this.data.selected_coupon);
            wx.showToast({
                title: '消费优惠券失败',
                icon: 'none',
                duration: 4000 // 持续时间为3秒
            });
        });
    },
    //使用钱包支付
    parse_pay: function () {
        let that = this;
        //这里采用事务，因为需要三个操作同时成功或者同时失败
        //第一个是减去钱包余额，第二是消费记录写入history数据库表，第三是写入publish数据库表
        console.log(that.data.user_id)
        console.log(app.globalData.openid)
        wx.showLoading({
            title: '正在支付',
        })
        wx.cloud.callFunction({
            name: 'parse_pay',
            data: {
                user_id: that.data.user_id,
                cost: that.data.cost,
                name: '帮我取订单支付',
                stamp: new Date().getTime(),

            },
            success: function (res) {
                console.log(res)
                //成功，则先获取抽成费率,再存入数据库
                if (res.result.success) {
                    that.get_rate();
                }
                //如果失败，则提示重试
                if (!res.result.success) {
                    wx.hideLoading()
                    wx.showToast({
                        title: '发布错误，请重试',
                        icon: 'none',
                        duration: 2000
                    })
                }


            },
            fail(er) {
                console.log(er)
            }
        })

    },
    //使用微信支付
    pay: function () {
        let that = this;
        let trade_no = Date.now().toString() + Math.floor(Math.random() * 1000).toString()
        const totalFee = parseInt(that.data.final_cost * 100);
        console.log("totalFee", totalFee);
        wx.cloud.callFunction({
            name: 'pay',  //云函数的名称，在后面我们会教大家怎么建
            data: {
                body: '代取快递',
                outTradeNo: trade_no,
                totalFee: totalFee,
            },
            success: res => {
                console.log("successfully call wx.cloud.pay,  res:", res);
                const payment = res.result.payment;
                wx.requestPayment({
                    ...payment,           //...这三点是 ES6的展开运算符，用于对变量、数组、字符串、对象等都可以进行解构赋值。
                    success(res) {
                        console.log('successfully called wx.requestPayment,res', res)
                        console.log("支付成功:" + that.data.final_cost + "$");
                        // 请求订阅消息权限
                        wx.requestSubscribeMessage({
                            tmplIds: ["LKBC9IqOwtwKmzG7G2KSpvs_4dJ45_dSL0_5mum3SfM", "qAVo5ed6_mwB4D1WYVaI7xULItzxOUR8_-P5v_bgleg"],
                            success(res) {
                                if (res["LKBC9IqOwtwKmzG7G2KSpvs_4dJ45_dSL0_5mum3SfM"] === 'accept') {
                                    // 发送支付成功的订阅消息
                                    that.sendPaySuccessNotification(trade_no);
                                    console.log("用户同意了支付成功订阅消息");
                                }

                                if (res["qAVo5ed6_mwB4D1WYVaI7xULItzxOUR8_-P5v_bgleg"] === 'accept') {
                                    // 发送订单送达的订阅消息
                                    // 如果你想立即发送，可以在这里调用发送函数
                                    // 或者你可以在适当的时机发送该消息
                                    console.log("用户同意送达通知 了订阅消息");
                                }
                            },
                            fail(err) {
                                console.error("Failed to request permission:", err);
                                Toast.fail({
                                    duration: 4500,
                                    message: '订阅授权失败',
                                    context: that,
                                })
                            }
                        });

                        //支付成功之后才能提交表单
                        that.add_order_form(trade_no);

                    },
                    fail(err) {
                        Toast.fail({
                            duration: 4500,
                            message: '咋取消了订单',
                            context: that,
                        })
                        that.setData({
                            submit_loading: false
                        })
                        console.error('failed called wx.requestPayment,err', err)
                    }
                })
            },
            fail(err) {
                console.log("failed call wx.cloud.pay ,err:", err);
                wx.showToast({
                    title: '支付失败, err: failed call wx.cloud.pay',
                    icon: 'none',
                    duration: 4500 // 持续时间为3秒
                });

                that.setData({
                    submit_loading: false
                })
            }
        })
    },
    sendPaySuccessNotification: function (trade_no) {
        let that = this;
        let fullYear = new Date().getFullYear();
        let month = new Date().getMonth() + 1;
        let date = new Date().getDate();
        let hours = new Date().getHours();
        let minutes = new Date().getMinutes();
        const cost = (that.data.final_cost).toString();
        const customer_name = that.data.address.name;
        const goods = "取件码：" + that.data.pick_up_code;
        console.log("customer_name:", customer_name);
        console.log("cost:", cost);

        wx.cloud.callFunction({
            name: 'paysuc',
            data: {
                cost: cost,
                deal_time: fullYear + '-' + month + '-' + date + ' ' + hours + ':' + minutes,
                trade_no: trade_no,
                goods: goods,
                customer_name: customer_name,
            },
            success: function (res) {
                if (res.result.success) {
                    console.log("successfully called wx.paysuc, res:", res);
                    console.log("支付成功的订阅消息推送成功");
                } else {
                    console.error("Unexpected error:", res.result.error);
                    wx.showToast({
                        title: '支付成功的订阅消息推送失败',
                        icon: 'none',
                        duration: 4500
                    });
                }
            },
            fail(e) {
                console.error("Failed to call wx.paysuc, err:", e);
                wx.showToast({
                    title: '推送失败, err: failed called wx.paysuc',
                    icon: 'none',
                    duration: 4500
                });
            }
        });
    },
    //请求获取发送订阅消息的权限
    subscribeMessage() {
        let that = this;
        wx.requestSubscribeMessage({
            tmplIds: ["LKBC9IqOwtwKmzG7G2KSpvs_4dJ45_dSL0_5mum3SfM"],
            success(res) {
                if (res["LKBC9IqOwtwKmzG7G2KSpvs_4dJ45_dSL0_5mum3SfM"] === 'accept') {
                    that.sendPaySuccessNotification();
                } else {
                    console.error("User denied permission");
                }
            },
            fail(err) {
                console.error("Failed to request permission:", err);
            }
        });
    },
    //把输入的信息提交到publish数据库表
    add_order_form: function (trade_no) {
        console.log("开始提交表单到数据库")
        let that = this;
        Toast.loading({
            duration: 0,
            forbidClick: true,
            message: '提交订单中...',
            mask: true,
        });
        // 用于订单记录，骑手查看
        db.collection('order_form').add({
            data: {
                //类型
                category: 'pick_up',
                // 快递站点
                selected_site: that.data.selected_site.title,
                express_site_index: that.data.selected_site.express_site_index,
                // 取件信息
                delivery_period: that.data.address.delivery_period,
                recipient: that.data.address.name,
                dormitory: that.data.address.dormitory,
                phone: that.data.address.phone,
                pick_up_code: that.data.pick_up_code,
                selectedExpressSize: that.data.selectedExpressSize,
                // 留言
                remarks: that.data.remarks,
                // 订单状态
                order_state: false,
                delivery_time: "None",
                trade_no: trade_no,
                // 金额
                cost: that.data.final_cost,
                // 订单创建时间
                created_time: new Date().getTime(),
            },
            success: function (res) {

                that.consume_coupon();


            },
            fail(er) {
                wx.showToast({
                    title: '提交表单失败',
                    icon: 'none',
                    duration: 4500 // 持续时间为3秒
                });
            }
        })
        // 订单记录，用户查看

    },
    refresh_data: function () {

        console.log("refresh_data is called")
        const index = app.globalData.selectedExpressSizeIndex;
        let final_cost = 999;
        if (index !== -1) {
            const price = this.data.prices[index];
            final_cost = app.globalData.coupon.discount * price;
            console.log("price=", price);
        }


        console.log("index=", index);


        this.setData({
            final_cost,
            selected_coupon: app.globalData.coupon,
            pick_up_code: app.globalData.pick_up_code,
            address: app.globalData.address,
            express_site_index: app.globalData.selected_site_index,
            selectedExpressSize: app.globalData.selectedExpressSize,
            express_size: index,
            selected_site: app.globalData.selected_site,
        })

        console.log("pick_up_code=", this.data.pick_up_code);
        console.log("selected_site=", this.data.selected_site);
        console.log("final_cost=", final_cost);
        console.log("selected_coupon=", this.data.selected_coupon);
        console.log("address=", this.data.address);
        console.log("selectedExpressSize=", this.data.selectedExpressSize);
        console.log("express_size=", this.data.express_size);

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
        this.refresh_data();
    },

    navigate2coupon: function () {
        wx.switchTab({
            url: '/pages/coupon/coupon',
        });
    },
    go_bushouhuo: function () {
        console.log("go_bushouhuo is called");
        wx.navigateTo({
            url: '/pages/dizhi/dizhi',
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