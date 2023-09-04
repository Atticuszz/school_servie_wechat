// pages/fabu/fabu.js
const app = getApp();
const db = wx.cloud.database();

Page({

    /**
     * 页面的初始数据
     */
    data: {
        credits: app.globalData.credits,
        coupons_category: [
            {
                id: 0,
                requirement: 5000,
                discount: 1,
                name: '白嫖券',
            },
            {
                id: 1,
                requirement: 2080,
                discount: 0.59,
                name: '半价券',
            },
            {
                id: 2,
                requirement: 888,
                discount: 0.88,
                name: '8.8折券',
            }
        ],
        claimable_coupons: [],
        redeemable_coupons: [
            {
                due_time: '2020-12-31',
                discount: 1,
                name: '白嫖券',
                if_due: false
            },
            {
                due_time: '2020-12-31',
                discount: 0.59,
                name: '半票券',
                if_due: false
            },
            {
                due_time: '2020-12-31',
                discount: 0.88,
                name: '8折券',
                if_due: false
            },
        ],
        due_coupons: [],


        page: 0,
        //中间值
        cost: 0,
        anniu_show: -1,          //做按钮显示限制，防止用户多次点击单个按钮
        kejin: true,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let that = this;
        that.ensure_user_exist();
        that.init_data();
    },
    ensure_user_exist: function () {
        // 先检查是否有这个用户（通过 _openid）
        db.collection('coupons').where({
            _openid: app.globalData.openid
        }).get().then(res => {
            if (res.data.length === 0) {
                // 用户不存在，先添加这个用户
                db.collection('coupons').add({
                    data: {
                        credits: app.globalData.credits,
                        coupons: []  // 初始化为空数组或者其他默认值
                    }
                }).then(res => {
                    console.log('用户添加成功', res);
                    // 然后你可以在这里添加领取优惠券的逻辑，与上面的更新操作基本相同。
                }).catch(err => {
                    console.log("添加的用户openid:", app.globalData.openid);
                    console.error('用户添加失败', err);
                });
            }
        }).catch(err => {
            console.log("查询的用户openid:", app.globalData.openid);
            console.error("查询用户失败", err);
        });
        // 保证用户存在
    },
    init_data: function () {
        // 初始化claimable_coupons
        let that = this;
        let claimable_coupons = [];
        console.log("coupons_category:", that.data.coupons_category);
        for (let i = 0; i < that.data.coupons_category.length; i++) {

            let category = that.data.coupons_category[i];
            if (category.requirement <= that.data.credits) {
                claimable_coupons.push(category);
            }
        }
        that.setData(
            {
                claimable_coupons: claimable_coupons,
            }
        )
        console.log("credits:", that.data.credits);
        console.log("claimable_coupons:", that.data.claimable_coupons);

        let old_redeemable_coupons = [];
        // 初始化redeemable_coupons,due_coupons

        db.collection('coupons').where({
            _openid: app.globalData.openid,
        }).orderBy('creat', 'desc').get({
            success: function (res) {
                old_redeemable_coupons = res.data[0].coupons;
                console.log("coupons.res.data:", res.data)
            },
            fail(er) {
                console.log("查询失败：", er)
            }
        })
        console.log("coupons.res.data.coupons:", old_redeemable_coupons);
        let [redeemable_coupons, due_coupons] = that.check_due(old_redeemable_coupons);
        that.setData({
            redeemable_coupons: redeemable_coupons,
            due_coupons: due_coupons,
        })
        // 检查是否优惠券是否过期
        console.log(" redeemable_coupons:", redeemable_coupons)
        console.log(" due_coupons:", due_coupons)

    },
    // 检查优惠券是否过期
    check_due: function (redeemable_coupons) {

        const ONE_DAY_IN_MS = 24 * 3600 * 1000; // 一天的毫秒数
        const ONE_MONTH_IN_MS = 30 * ONE_DAY_IN_MS; // 一个月的毫秒数
        let new_redeemable_coupons = [];
        let new_due_coupons = [];
        for (let i = redeemable_coupons.length - 1; i >= 0; i--) { // 倒序遍历
            let coupon = redeemable_coupons[i];
            let now = new Date();
            let due_time = new Date(coupon.due_time);

            if (coupon.if_due === false) {
                if (now.getTime() > due_time.getTime()) {
                    coupon.if_due = true;
                    // 新过期的
                    new_due_coupons.push(coupon)
                } else {
                    new_redeemable_coupons.push(coupon)
                }
            } else {
                if (now.getTime() > due_time.getTime() + ONE_MONTH_IN_MS) { // 如果过期了一个月就清除它
                    redeemable_coupons.splice(i, 1); // 删除该元素

                }
                //     以前就过期了
                new_due_coupons.push(coupon)
            }
        }
        // 新增代码：即时更新数据库
        db.collection('coupons').where({
            _openid: app.globalData.openid,
        }).update({
            data: {
                'coupons': redeemable_coupons // 更新后的数组
            }
        }).then(res => {
            console.log('数据库删除成功:', redeemable_coupons, "res:", res);
        }).catch(err => {
            console.error('数据库删除失败:', redeemable_coupons, "err:", err);
        });
        return [new_redeemable_coupons, new_due_coupons]


    },
    //领取优惠券

    onGetCoupon: function (event) {
        const couponId = event.currentTarget.dataset.id;  // 从事件对象中获取优惠券 id


        // 如果找到了优惠券
        let selectedCoupon = null;
        for (let coupon of this.data.coupons_category) {
            if (coupon.id === couponId) {
                selectedCoupon = coupon;
                break;
            }
        }
        if (selectedCoupon) {
            app.globalData.credits -= selectedCoupon.requirement;  // 扣除积分
            const newCoupon = this.transformCoupon(selectedCoupon);  // 使用辅助函数转换优惠券对象
            // 更新操作
            db.collection('coupons').where({
                _openid: app.globalData.openid  // 替换为目标用户的 OpenID
            }).update({
                data: {
                    'coupons': db.command.push(newCoupon), // 添加新的优惠券
                    'credits': app.globalData.credits
                }
            }).then(res => {
                console.log('领取成功', res);
                console.log('领取的优惠券:', newCoupon);
            }).catch(err => {
                console.error('领取失败', err);
            });
            this.init_data();
        } else {
            console.error('未找到对应的优惠券');
            console.log("优惠券种类:", this.data.coupons_category);
            console.error('查找的优惠券id:', couponId);

        }

    },
    transformCoupon: function (coupon) {
        // 获取当前时间并添加30天（或任何你需要的时间）
        let due_time = new Date();
        due_time.setDate(due_time.getDate() + 30);  // 假设优惠券有效期为30天
        due_time = due_time.toISOString().split('T')[0];  // 转换为 'YYYY-MM-DD' 格式

        return {
            due_time: due_time,
            discount: coupon.discount,
            name: coupon.name,
            if_due: false
        };
    },
    function(event) {
        let that = this;
        if (!that.data.kejin) {
            return false;
        }
        that.setData({
            anniu_show: event.currentTarget.dataset.anniu_show,
            kejin: false,
        })

        let id = event.currentTarget.dataset.id
        let order_id = event.currentTarget.dataset.order_id
        //用data里面的cost来接受点击的那个记录的cost值，方便传给事务处理
        that.setData({
            cost: event.currentTarget.dataset.cost,
        })
        wx.showLoading({
            title: '正在确认',
        })
        //使用get_jiePhone云函数进行联表查询获得接单者的_openid（这个有两个作用，第一存入history钱记录的时候需要，第二要用来查询user表获取user_id）
        wx.cloud.callFunction({
            name: 'get_jiePhone',
            data: {
                id: id
            },
            success: function (res) {
                console.log('这是接单者的openid：' + res.result.list[0].List[0]._openid)

                that.confirmshiwu(res.result.list[0].List[0]._openid, id, order_id);

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
    }

    ,
    confirmshiwu: function (e, e_id, order_id) {
        let that = this;
        db.collection('user').where({
            _openid: e
        }).get({
            success: function (re) {
                console.log('这是接单的user_id：' + re.data[0]._id)
                //都拿到用户的openid和用户的user表_id,还有publish的_id，开始事务处理
                wx.cloud.callFunction({
                    name: 'confirm_songda',
                    data: {
                        user_id: re.data[0]._id,
                        jie_openid: e,
                        publish_id: e_id,  //publish的_id,
                        cost: that.data.cost,
                        stamp: new Date().getTime(),
                        name: '接单赚钱',
                        order_id: order_id,
                    },
                    success: function (r) {

                        if (r.result.success) {
                            //成功后，要重新获取新数据，
                            that.shuju();
                            wx.hideLoading()
                            wx.showToast({
                                title: '确认成功',
                                icon: 'success',
                                duration: 2000
                            })
                            that.setData({
                                anniu_show: true,
                                kejin: true,
                            })


                        }
                        if (!r.result.success) {
                            wx.hideLoading()
                            wx.showToast({
                                title: '失败，请重试',
                                icon: 'none',
                                duration: 2000
                            })
                            that.setData({
                                anniu_show: true,
                                kejin: true
                            })

                        }
                    },
                    fail(err) {
                        wx.hideLoading()
                        wx.showToast({
                            title: '失败，请重试',
                            icon: 'none',
                            duration: 2000
                        })
                        that.setData({
                            anniu_show: true,
                            kejin: true
                        })

                    }
                })
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
                    kejin: true
                })
            }
        })
    }
    ,
//拨打电话，联系跑腿员
    call_phone: function (event) {
        let that = this;
        that.setData({
            anniu_show: event.currentTarget.dataset.anniu_show,
        })
        wx.showLoading({
            title: '正在拨打',
        })
        wx.cloud.callFunction({
            name: 'get_jiePhone',
            data: {
                id: event.currentTarget.dataset.id,
            },
            success: function (res) {
                console.log(res)
                wx.hideLoading()
                wx.makePhoneCall({
                    phoneNumber: res.result.list[0].List[0].jiedan_phone,
                })
                that.setData({
                    anniu_show: true,
                })
            },
            fail(er) {
                console.log(er)
                that.setData({
                    anniu_show: true,
                })
            }
        })
    }
    ,
//在publish数据库表里添加cui布尔值字段，来限制只能发一次催一催，防止多次点击发送
    cui: function (event) {
        let that = this;
        if (!that.data.kejin) {
            return false;
        }
        that.setData({
            anniu_show: event.currentTarget.dataset.anniu_show,
            kejin: false,
        })
        wx.showLoading({
            title: '正在催',
        })
        wx.cloud.callFunction({
            name: 'get_jiePhone',
            data: {
                id: event.currentTarget.dataset.id,
            },
            success: function (res) {
                console.log(res)
                wx.cloud.callFunction({
                    name: 'cui',
                    data: {
                        jie_phone: res.result.list[0].List[0].jiedan_phone,
                        _id: event.currentTarget.dataset.id
                    },
                    success: function (re) {
                        console.log(re)
                        wx.hideLoading()
                        if (re.result.success) {
                            wx.showToast({
                                title: '操作成功',
                                icon: 'success',
                                duration: 2000
                            })
                            //成功后，要重新获取新数据，
                            that.shuju();
                            that.setData({
                                anniu_show: true,
                                kejin: true,
                            })
                        }
                        if (!re.result.success) {
                            wx.showToast({
                                title: '失败，请重试',
                                icon: 'none',
                                duration: 2000
                            })
                            that.setData({
                                anniu_show: true,
                                kejin: true
                            })
                        }

                    },
                    fail(eee) {
                        console.log(eee)
                        wx.hideLoading()
                        wx.showToast({
                            title: '失败，请重试',
                            icon: 'none',
                            duration: 2000
                        })
                        that.setData({
                            anniu_show: true,
                            kejin: true
                        })
                    }
                })
            },
            fail(er) {
                console.log(er)
                wx.hideLoading()
                wx.showToast({
                    title: '失败，请重试',
                    icon: 'none',
                    duration: 2000
                })
                that.setData({
                    anniu_show: true,
                    kejin: true
                })
            }
        })
    }
    ,
//取消订单
//第一，改变publish的state为4，第二、把钱退回钱包里，第三、存入history数据库表
//重要的一点，需要把publish数据库表权限改为所有人可读写
//    {
//       "read": true,
//       "write": true
//     }
    cancel_order: function (event) {
        let that = this;
        if (!that.data.kejin) {
            return false;
        }
        console.log(event)
        that.setData({
            anniu_show: event.currentTarget.dataset.anniu_show,
            kejin: false,
        })
        wx.showLoading({
            title: '正在取消',
        })

        db.collection('user').where({
            _openid: event.currentTarget.dataset._openid,
        }).get({
            success: function (rr) {
                wx.cloud.callFunction({
                    name: 'cancel_order',
                    data: {
                        _id: event.currentTarget.dataset.id,
                        name: '取消订单',
                        stamp: new Date().getTime(),
                        cost: event.currentTarget.dataset.yuanjia,
                        user_id: rr.data[0]._id,

                    },
                    success: function (res) {
                        console.log(res)
                        if (res.result.success) {

                            //重新获取数据进行list更新
                            that.shuju();
                            wx.hideLoading()
                            wx.showToast({
                                title: '取消成功',
                                icon: 'success',
                                duration: 2000
                            })
                            that.setData({
                                anniu_show: true,
                                kejin: true,
                            })
                        }
                        if (!res.result.success) {
                            wx.hideLoading();
                            wx.showToast({
                                title: '取消失败，请重试',
                                icon: 'none',
                                duration: 2000
                            })
                            that.setData({
                                anniu_show: true,
                                kejin: true
                            })
                        }
                    },
                    fail(er) {
                        console.log(er)
                        wx.hideLoading();
                        wx.showToast({
                            title: '取消失败，请重试',
                            icon: 'none',
                            duration: 2000
                        })
                        that.setData({
                            anniu_show: true,
                            kejin: true
                        })
                    }
                })
            },
            fail(ee) {
                wx.hideLoading();
                wx.showToast({
                    title: '取消失败，请重试',
                    icon: 'none',
                    duration: 2000
                })
                that.setData({
                    anniu_show: true,
                    kejin: true
                })
            }
        })

    }
    ,
//监听切换导航的变化
    onChange(event) {
        console.log(event.detail.title)
        let that = this;
        that.setData({
            tab: event.detail.title,
            page: 0,
        })
        that.shuju();

    }
    ,
    shuju: function () {
        let that = this;

        if (that.data.tab == '全部') {
            that.get();

        }
        if (that.data.tab == '待接单') {
            //获取待接单的单子列表
            that.get_dai();
        }
        if (that.data.tab == '配送中') {
            //获取配送中的单子列表
            that.get_song();
        }
        if (that.data.tab == '待确认') {
            //获取已完成的单子列表
            that.get_que();
        }

        if (that.data.tab == '已完成') {
            //获取已完成的单子列表
            that.get_wan();
        }
        if (that.data.tab == '已取消') {
            //获取已取消的单子列表
            that.get_qu();
        }
    }
    ,

//获取单子列表
//publish表里的字段state等于1代表待接单，2代表配送中，3代表已完成，4代表已取消，5代表待确认
    get: function () {
        let that = this;
        db.collection('publish').where({
            _openid: app.globalData.openid,
        }).orderBy('creat', 'desc').limit(20).get({
            success: function (res) {
                console.log(res)
                that.setData({
                    list: res.data,
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            },
            fail() {
                //提示用户获取失败
                wx.showToast({
                    title: '获取失败，请重新获取',
                    icon: 'none',
                    duration: 2000
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            }
        })
    }
    ,
//获取待接单的单子列表
    get_dai: function () {
        let that = this;
        db.collection('publish').where({
            state: 1,
            _openid: app.globalData.openid,
        }).orderBy('creat', 'desc').limit(20).get({
            success: function (res) {
                console.log(res)
                that.setData({
                    list: res.data,
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            },
            fail() {
                //提示用户获取失败
                wx.showToast({
                    title: '获取失败，请重新获取',
                    icon: 'none',
                    duration: 2000
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            }
        })
    }
    ,
//获取配送中的单子列表
    get_song: function () {
        let that = this;
        db.collection('publish').where({
            state: 2,
            _openid: app.globalData.openid,
        }).orderBy('creat', 'desc').limit(20).get({
            success: function (res) {
                console.log(res)
                that.setData({
                    list: res.data,
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            },
            fail() {
                //提示用户获取失败
                wx.showToast({
                    title: '获取失败，请重新获取',
                    icon: 'none',
                    duration: 2000
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            }
        })
    }
    ,
//获取待确认的单子列表
    get_que: function () {
        let that = this;
        db.collection('publish').where({
            state: 5,
            _openid: app.globalData.openid,
        }).orderBy('creat', 'desc').limit(20).get({
            success: function (res) {
                console.log(res)
                that.setData({
                    list: res.data,
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            },
            fail() {
                //提示用户获取失败
                wx.showToast({
                    title: '获取失败，请重新获取',
                    icon: 'none',
                    duration: 2000
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            }
        })
    }
    ,
//获取已完成的单子列表
    get_wan: function () {
        let that = this;
        db.collection('publish').where({
            state: 3,
            _openid: app.globalData.openid,
        }).orderBy('creat', 'desc').limit(20).get({
            success: function (res) {
                console.log(res)
                that.setData({
                    list: res.data,
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            },
            fail() {
                //提示用户获取失败
                wx.showToast({
                    title: '获取失败，请重新获取',
                    icon: 'none',
                    duration: 2000
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            }
        })
    }
    ,
//获取已取消的单子列表
    get_qu: function () {
        let that = this;
        db.collection('publish').where({
            state: 4,
            _openid: app.globalData.openid,
        }).orderBy('creat', 'desc').limit(20).get({
            success: function (res) {
                console.log(res)
                that.setData({
                    list: res.data,
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            },
            fail() {
                //提示用户获取失败
                wx.showToast({
                    title: '获取失败，请重新获取',
                    icon: 'none',
                    duration: 2000
                })
                wx.stopPullDownRefresh(); //暂停刷新动作
            }
        })
    }
    ,

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
            //经过上一句执行，page的值已经为1了，所以下面的page*20=20
            db.collection('publish').where({
                _openid: app.globalData.openid,
            }).orderBy('creat', 'desc').skip(page * 20).limit(20).get({
                success: function (res) {
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
                        //这里的page为1，即新页面
                        page: page,
                        list: that.data.list.concat(res.data)
                    })
                },
                fail() {
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
        if (that.data.tab == '待接单') {
            let page = that.data.page + 1;
            //经过上一句执行，page的值已经为1了，所以下面的page*20=20，下标20就是第21条记录
            db.collection('publish').where({
                state: 1,
                _openid: app.globalData.openid,
            }).orderBy('creat', 'desc').skip(page * 20).limit(20).get({
                success: function (res) {
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
                fail() {
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
        if (that.data.tab == '配送中') {
            let page = that.data.page + 1;
            //经过上一句执行，page的值已经为1了，所以下面的page*20=20
            db.collection('publish').where({
                state: 2,
                _openid: app.globalData.openid,
            }).orderBy('creat', 'desc').skip(page * 20).limit(20).get({
                success: function (res) {
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
                fail() {
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
        if (that.data.tab == '待确认') {
            let page = that.data.page + 1;
            //经过上一句执行，page的值已经为1了，所以下面的page*20=20
            db.collection('publish').where({
                state: 5,
                _openid: app.globalData.openid,
            }).orderBy('creat', 'desc').skip(page * 20).limit(20).get({
                success: function (res) {
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
                fail() {
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
        if (that.data.tab == '已完成') {
            let page = that.data.page + 1;
            //经过上一句执行，page的值已经为1了，所以下面的page*20=20
            db.collection('publish').where({
                state: 3,
                _openid: app.globalData.openid,
            }).orderBy('creat', 'desc').skip(page * 20).limit(20).get({
                success: function (res) {
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
                fail() {
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
        if (that.data.tab == '已取消') {
            let page = that.data.page + 1;
            //经过上一句执行，page的值已经为1了，所以下面的page*20=20
            db.collection('publish').where({
                state: 4,
                _openid: app.globalData.openid,
            }).orderBy('creat', 'desc').skip(page * 20).limit(20).get({
                success: function (res) {
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
                fail() {
                    wx.showToast({
                        title: '获取失败',
                        icon: 'none'
                    })
                }
            })
        }
    }
    ,
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    }
    ,

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        let that = this;
        that.setData({
            anniu_show: -1,
        })
        //实时刷新单子列表
        if (that.data.tab == '全部') {
            that.get();
        }
        if (that.data.tab == '待接单') {
            //获取待接单的单子列表
            that.get_dai();
        }
        if (that.data.tab == '配送中') {
            //获取配送中的单子列表
            that.get_song();
        }
        if (that.data.tab == '待确认') {
            //获取待确认的单子列表
            that.get_que();
        }
        if (that.data.tab == '已完成') {
            //获取已完成的单子列表
            that.get_wan();
        }
        if (that.data.tab == '已取消') {
            //获取已取消的单子列表
            that.get_qu();
        }


    }
    ,

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    }
    ,

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    }
    ,

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        let that = this;
        that.setData({
            anniu_show: -1,
        })
        that.shuju();
    }
    ,

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        //触底了就触发gengduo函数，去获取更多数据
        this.gengduo();
    }
    ,

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})