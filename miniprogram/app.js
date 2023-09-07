//app.js


App({
    onLaunch: function () {
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力')
        } else {
            wx.cloud.init({
                // env 参数说明：
                //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
                //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
                //   如不填则使用默认环境（第一个创建的环境）
                env: 'school2service-0gp1dcf9a73528f4',
                traceUser: true,
            })
        }

        this.check_locked();

    },
    globalData: {
        system_locked: false,
        userInfo: null,
        openid: '',
        channel: '跑腿资讯',
        pick_up_code: '',
        selectedExpressSize: null,
        selectedExpressSizeIndex: -1,
        selected_site: null,
        selected_site_index: null,
        address: null,
        coupon: {'discount': 1},
        credits: 5000,
    },
    check_locked: function () {
        const db = wx.cloud.database();
        // 查询 system_lock 集合
        db.collection('system_lock').limit(1).get({
            success: (res) => {
                let if_locked = false;
                if (res.data.length > 0 && res.data[0].hasOwnProperty('if_system_locked')) {
                    if_locked = res.data[0].if_system_locked;
                }
                if(if_locked){
                    wx.showModal({
                title: '警告',
                content: '系统已锁定！',
                showCancel: false,  // 不显示取消按钮
                confirmText: '解密', // 按钮的文本，例如：'前往'
                success(res) {
                    if (res.confirm) {
                        // 用户点击了前往按钮
                        wx.switchTab({
                            url: '/pages/my/my' // 请替换为您的 tabBar 页面路径
                        });
                    }
                }
            });
                }
                console.log("查询 system_lock 成功：", res);
            },
            fail: (err) => {
                console.error("查询 system_lock 失败：", err);
            }
        });
    },
})
