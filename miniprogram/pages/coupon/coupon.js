// pages/fabu/coupon.js
const app = getApp();
const db = wx.cloud.database();
import Toast from '@vant/weapp/toast/toast';

const _ = db.command;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        password: '',
        imageUrl: {
            'coupon': "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%9B%BE%E6%A0%87/coupon2.jpg?sign=eb17a87f619374daa89e6f18d8402e08&t=1693986436"
        },
        credits: 0,
        coupons_category: [
            {
                id: 0,
                requirement: 5000,
                discount: 0,
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
        redeemable_coupons: [],
        due_coupons: [],
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        app.check_locked();
        app.globalData.inviterOpenid = options.inviterOpenid;
        console.log("inviterOpenid:", options.inviterOpenid);  // 输出: 123456
        this.ensure_user_exist();

    },
    check_share: function () {
        let that = this;
        const currentUserOpenid = app.globalData.openid;
        const inviterOpenid = app.globalData.inviterOpenid;
        if (!inviterOpenid || inviterOpenid==="undefined") {
            console.log("[DEBUG] - No inviterOpenid");
            return;
        }
        if (currentUserOpenid === inviterOpenid) {
            console.log("[DEBUG] - InviterOpenid is currentUserOpenid");
            return;
        }
        console.log("[DEBUG] - InviterOpenid:", inviterOpenid);
        // 查询当前用户的if_invited字段
        db.collection('coupons').where({
            _openid: currentUserOpenid
        }).get().then(res => {
            console.log("[DEBUG] - Coupons collection currentUserOpenid query result:", res);
            const if_invited = res.data[0].if_invited;

            console.log("[DEBUG] - Current user if_invited status:", if_invited);

            if (!if_invited) {
                // 查询coupon集合中是否存在与inviterOpenid匹配的记录
                db.collection('coupons').where({
                    _openid: inviterOpenid
                }).get().then(res => {
                    if (res.data.length) {
                        console.log("[DEBUG] - Found matching inviterOpenid in coupon collection");

                        // 为邀请者添加积分
                        db.collection('coupons').where({
                            _openid: inviterOpenid
                        }).update({
                            data: {
                                credits: _.inc(2888)
                            }
                        }).then(updateResult => {
                            console.log("[DEBUG] - Added credits to inviter:", updateResult.stats.updated);

                            // 为当前用户添加积分并将if_invited设置为true
                            db.collection('coupons').where({
                                _openid: currentUserOpenid
                            }).update({
                                data: {
                                    credits: _.inc(2888),
                                    if_invited: true
                                }
                            }).then(updateResult => {
                                console.log("[DEBUG] - Added points to current user:", updateResult.stats.updated);
                                Toast.success({
                                    message: '被邀请+2888积分',
                                    context: that,
                                    duration: 3000,
                                });
                            }).catch(err => {
                                console.error("[DEBUG - ERROR] - Error while updating current user:", err);
                            });
                        }).catch(err => {
                            console.error("[DEBUG - ERROR] - Error while updating inviter:", err);
                        });
                    } else {
                        console.log("[DEBUG] - No matching inviterOpenid found in coupon collection");
                    }
                }).catch(err => {
                    console.error("[DEBUG - ERROR] - Error during coupon collection query:", err);
                });
            } else {
                console.log("[DEBUG] - Current user already invited");
            }
        }).catch(err => {
            console.error("[DEBUG - ERROR] - Error during user data retrieval:", err);
        });
    },
    ensure_user_exist: function () {
        let that = this;
        // 先检查是否有这个用户（通过 _openid）
        db.collection('coupons').where({
            _openid: app.globalData.openid
        }).get().then(res => {
            if (res.data.length === 0) {
                // 用户不存在，先添加这个用户
                db.collection('coupons').add({
                    data: {
                        credits: 5000, // 默认积分
                        coupons: [], // 初始化为空数组或者其他默认值
                        if_invited: false // 默认未邀请过
                    }
                }).then(res => {
                    console.log('用户添加成功', res);
                    // 然后你可以在这里添加领取优惠券的逻辑，与上面的更新操作基本相同。
                    Toast.success({
                        message: '+5000积分',
                        context: that,
                        duration: 3000,
                    });
                    that.check_share();
                    that.init_data();
                }).catch(err => {

                    console.log("添加的用户openid:", app.globalData.openid);
                    console.error('用户添加失败', err);
                });
            } else {
                that.check_share();
                that.init_data();
            }
        }).catch(err => {
            console.log("查询的用户openid:", app.globalData.openid);
            console.error("查询用户失败", err);
        });
    },
    // 保证用户存在
    init_data: function () {
        console.log("init_data");
        let that = this;
        Toast.loading({
            message: '加载券中...',
            forbidClick: true,
            duration: 0,  // 持续显示 toast
            context: that,
        });
        let coupon_in_db;
        db.collection('coupons').where({
            _openid: app.globalData.openid,
        }).orderBy('creat', 'desc').limit(1).get({
            success: function (res) {
                // 初始化用户积分
                app.globalData.credits = res.data[0].credits;
                coupon_in_db = res.data[0].coupons;

                that.setData({
                    credits: app.globalData.credits
                })
                // console.log("coupons.res.data:", res.data);
                // console.log("coupons.res.data[0].credits:", res.data[0].credits);
                // 初始化claimable_coupons
                let claimable_coupons = [];
                // console.log("coupons_category:", that.data.coupons_category);
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
                // console.log("claimable_coupons:", that.data.claimable_coupons);
                // 从数据库中没有过期一个月的优惠券中筛选出可用和过期的
                // 初始化redeemable_coupons,due_coupons
                that.check_due(coupon_in_db);
                Toast.success({
                    message: '加载成功！',
                    context: that,
                    duration: 1000,
                });

            },
            fail(er) {
                console.log("查询res.data[0].credits失败：", er)
            }
        })
    },

    // 检查优惠券是否过期
    check_due: function (redeemable_coupons) {
        console.log("check_due :", redeemable_coupons);
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
                    // console.log("新过期的:", coupon);
                    new_due_coupons.push(coupon)
                } else {
                    new_redeemable_coupons.push(coupon)
                }
            } else {
                if (now.getTime() > due_time.getTime() + ONE_MONTH_IN_MS) { // 如果过期了一个月就清除它
                    // console.log("过期了1个月的:", coupon);
                    redeemable_coupons.splice(i, 1); // 删除该元素

                }
                //     以前就过期了
                new_due_coupons.push(coupon)
                // console.log("以前的过期了的:", coupon);
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
            console.log('数据库更新成功', "res:", res);
            console.log(" new_due_coupons:", new_due_coupons);
        }).catch(err => {
            console.error('数据库更新失败:', redeemable_coupons, "err:", err);
        });

        this.setData({
            redeemable_coupons: new_redeemable_coupons,
            due_coupons: new_due_coupons,
        })
        // 检查是否优惠券是否过期
        console.log(" new_redeemable_coupons:", new_redeemable_coupons);
    },
    //领取优惠券

    onGetCoupon: function (event) {


        // 这里应该有一个
        // 提示正在领取优惠券的弹窗
        Toast.loading({
            message: '领取中...',
            forbidClick: true,
            duration: 0,  // 持续显示 toast
            context: this,
        });


        const couponId = event.currentTarget.dataset.id;  // 从事件对象中获取优惠券 id


        // 如果找到了优惠券
        let selectedCoupon = null;
        for (let coupon of this.data.coupons_category) {
            if (coupon.id === couponId) {
                selectedCoupon = coupon;
                break;
            }
        }
        console.log("selectedCoupon:", selectedCoupon);
        if (selectedCoupon) {
            app.globalData.credits -= selectedCoupon.requirement;  // 扣除积分
            const newCoupon = this.transformCoupon(selectedCoupon);  // 使用辅助函数转换优惠券对象
            console.log("transformCoupon:", newCoupon);
            // 更新操作
            db.collection('coupons').where({
                _openid: app.globalData.openid  // 替换为目标用户的 OpenID
            }).update({
                data: {
                    'coupons': db.command.push(newCoupon), // 添加新的优惠券
                    'credits': app.globalData.credits
                }

            }).then(res => {
                this.init_data();
                console.log('领取成功', res);
                console.log('领取的优惠券:', newCoupon);


                // 这里应该有一个
                // 1. 弹窗提示用户优惠券领取成功
                // 显示领取成功的轻提示
                Toast.success({
                    message: '领取成功',
                    context: this,
                });
            }).catch(err => {
                console.error('领取失败', err);
                // 显示领取失败的轻提示
                Toast.fail({
                    message: '领取失败',
                    context: this,
                });
            });

        } else {
            // 未找到对应的优惠券
            // 这里应该有一个
            // 1. 弹窗提示用户优惠券领取失败
            // 显示领取失败的轻提示
            Toast.fail({
                message: '领取失败',
                context: this,
            });
            console.error('未找到对应的优惠券');
            console.log("优惠券种类:", this.data.coupons_category);
            console.error('查找的优惠券id:', couponId);

        }

    },
    transformCoupon: function (coupon) {
        // 获取当前时间并添加30天（或任何你需要的时间）
        let due_time = new Date();
        due_time.setDate(due_time.getDate() + 7);  // 假设优惠券有效期为7天
        due_time = due_time.toISOString().split('T')[0];  // 转换为 'YYYY-MM-DD' 格式

        return {
            due_time: due_time,
            discount: coupon.discount,
            name: coupon.name,
            if_due: false,
            created_time: new Date().getTime()
        };
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

    }

    ,
    select_coupon: function (e) {
        if (e.currentTarget.dataset.coupon) {
            app.globalData.coupon = e.currentTarget.dataset.coupon;
            console.log("app.globalData.coupon.created_time:", app.globalData.coupon.created_time);
            console.log("e.currentTarget.dataset.coupon:", e.currentTarget.dataset.coupon);
            console.log("app.globalData.coupon:", app.globalData.coupon);
        } else {
            console.log("e.currentTarget.dataset.coupon:", e.currentTarget.dataset.coupon);
        }


        // 跳转优惠券使用界面
        wx.navigateTo({
            url: '../qu/qu',
        })
    },
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
        app.check_locked();
        if (typeof this.getTabBar === 'function' &&
            this.getTabBar()) {
            this.getTabBar().init()
        }
        this.ensure_user_exist();

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
        this.ensure_user_exist();
        wx.stopPullDownRefresh();
    }
    ,

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
    }
    ,
    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})