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
        inviterOpenid: '',
        system_locked: false,
        userInfo: null,
        openid: '',
        pick_up_code: '',
        selectedExpressSize: null,
        selectedExpressSizeIndex: -1,
        selected_site: null,
        selected_site_index: null,
        address: null,
        coupon: {'discount': 1},
        credits: 5000,
        express_site_list: [
            {
                "desc": "中通,极兔,申通,京东,丹鸟",
                "thumb": "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%BF%AB%E9%80%92%E7%AB%99%E7%82%B9/%E8%8F%9C%E9%B8%9F%E9%A9%BF%E7%AB%99.jpg?sign=cd69487f3cbcc45c6a358ebbba5822e5&t=1693985078",
                "title": "菜鸟驿站(校内)",
                "express_site_index": 0
            },
            {
                "desc": "下午5:00关门,快递柜24小时",
                "express_site_index": 1,
                "thumb": "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%BF%AB%E9%80%92%E7%AB%99%E7%82%B9/%E9%82%AE%E6%94%BF.png?sign=3743dcba1ecdb0cad43fba9287ee6974&t=1693985037",
                "title": "中国邮政(校内)",
            },
            {
                "desc": "泰来苑98幢:顺丰,韵达,天猫",
                "express_site_index": 2,
                "thumb": "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%BF%AB%E9%80%92%E7%AB%99%E7%82%B9/%E9%A9%BF%E6%94%B6%E5%8F%91%E9%A9%BF%E7%AB%99.png?sign=0014d18abfbd7e37217695e56a8507e3&t=1693985060",
                "title": "驿收发驿站(校外)",
            },
            {
                "desc": "圆通速递'",
                "express_site_index": 3,
                "thumb": "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%BF%AB%E9%80%92%E7%AB%99%E7%82%B9/%E5%9C%86%E9%80%9A.png?sign=d1935afb29a8eaf2716d83dd29cec913&t=1693985018",
                "title": "妈妈驿站(校外)",
            },
            {
                "desc": "泰来苑100幢",
                "thumb":"https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%BF%AB%E9%80%92%E7%AB%99%E7%82%B9/%E8%8F%9C%E9%B8%9F%E9%A9%BF%E7%AB%99.jpg?sign=cd69487f3cbcc45c6a358ebbba5822e5&t=1693985078",
                "title": "菜鸟驿站(校外)",
                "express_site_index": 4,
            }
        ]
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
