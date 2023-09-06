Component({
    data: {
        active: 0,
        list: [
            {icon: "home-o", text: "首页", url: "/pages/index/index"},
            // {icon: "shop-o", text: "分类", url: "/pages/publish/publish"},
            {icon: "coupon-o", text: "优惠券", url: "/pages/coupon/coupon"},
            {icon: "orders-o", text: "订单", url: "/pages/order/order"},
            {icon: "user-o", text: "我的", url: "/pages/my/my"}
        ]
    },

    methods: {
        onChange(event) {
            this.setData({active: event.detail});
            wx.switchTab({url: this.data.list[event.detail].url});
        },
        init() {
            const page = getCurrentPages().pop();
            this.setData({
                active: this.data.list.findIndex(item => item.url === `/${page.route}`)
            });
        }
    }

});
