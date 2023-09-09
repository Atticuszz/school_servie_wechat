// pages/publish/publish.js
const app = getApp();
const db = wx.cloud.database();
import Toast from '@vant/weapp/toast/toast';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        search_value: '',
        delivery_sites: app.globalData.express_site_list,
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
        all_orders: [],
        // express_site_index->商品信息 thumb,selectedExpressSize,title,数量,order_price
        // pick_up_code
        // address ->delivery_period,recipient,dormitory,phone
        // created_time
    },
    onCancel: function () {
        this.setData({
            search_value: ''
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        app.check_locked();
        // 模拟从 CMS 或其他后端服务获取数据
        this.init_orders();
    },
    init_orders: function () {
        let that = this;
        // wx.showToast(
        //     {
        //         title: '加载订单中',
        //         icon: 'loading',
        //         duration: 10000
        //     }
        // )
        // 提示正在领取优惠券的弹窗
        Toast.loading({
            message: '加载订单中...',
            forbidClick: true,
            duration: 0,  // 持续显示 toast
            context: that,
        });
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
                    all_orders: orders,
                });
                Toast.success({
                    message: '查询订单成功',
                    context: that,
                    duration: 2000,
                });
            })
            .catch(err => {
                console.error("查询失败:", err);
            });
    },

    formatDate: function (unixTimestamp) {
        const date = new Date(unixTimestamp);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    },
    on_search_change: function (e) {
        const inputValue = e.detail.trim(); // 获取输入框的内容并去除两端的空格

        if (!inputValue) { // 如果输入框为空
            this.setData({orders: this.data.all_orders}); // 显示所有订单
            return;
        }
        // 检查输入值是否像日期
        let matchedOrders = [];
        if ((inputValue.match(/-/g) || []).length === 2) {
            // 筛选出包含输入日期的订单
            matchedOrders = this.data.all_orders.filter(order => {
                const formattedDate = this.formatDate(order.created_time).split(" ")[0]; // 转换日期并去除时间部分
                console.log("formattedDate:", formattedDate);
                return formattedDate === inputValue;
            });
        } else {
            // 筛选出包含输入数字取件码的订单
            matchedOrders = this.data.all_orders.filter(order => {
                return order.pick_up_code.includes(inputValue);
            });
        }

        this.setData({orders: matchedOrders});
    },
    get_all_orders: function () {
        Toast.loading({
            message: '全部订单...',
            forbidClick: true,
            duration: 0,  // 持续显示 toast
            context: this,
        });

        let allFetchedOrders = [];

        const fetchOrders = (lastOrderTimestamp) => {
            let query = db.collection('order_form').where({_openid: app.globalData.openid}).orderBy('created_time', 'desc').limit(20);

            if (lastOrderTimestamp) {
                query = query.where({created_time: db.command.lt(lastOrderTimestamp)});
            }

            query.get().then(res => {
                if (res.data.length > 0) {
                    allFetchedOrders = allFetchedOrders.concat(res.data);
                    fetchOrders(res.data[res.data.length - 1].created_time);  // 使用最后一个订单的时间作为下一个查询的起点
                } else {
                    // 当没有更多数据时，处理所有获取的订单
                    const orders = allFetchedOrders.map(item => {
                        // 查找与 express_site_index 匹配的 thumb
                        const matchingSite = this.data.delivery_sites.find(site => site.express_site_index === item.express_site_index);
                        const thumb = matchingSite ? matchingSite.thumb : 'default_thumb.jpg';

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
                        all_orders: orders,
                    });

                    Toast.success({
                        message: '获取全部订单',
                        context: this,
                        duration: 3000,
                    });
                }
            }).catch(err => {
                console.error("查询失败:", err);
            });
        }

        fetchOrders();  // 开始拉取所有订单
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
        this.init_orders();
        wx.stopPullDownRefresh();
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