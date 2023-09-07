// pages/index/index.js
const app = getApp();
const db = wx.cloud.database();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        autoplay: true,
        circular: true,
        banner: ["https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E4%B8%BB%E9%A1%B5%E9%9D%A2/banner_3.jpg?sign=6e518d148293edfde6de4c02705e3301&t=1693983973"
            ,
            "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E4%B8%BB%E9%A1%B5%E9%9D%A2/banner_2.jpeg?sign=b39e9cb06d303ba7caddc517adb2125c&t=1693983969"
            ,
            "https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E4%B8%BB%E9%A1%B5%E9%9D%A2/banner_1.jpg?sign=58b62ba7b23d70a2b549bc3b2fe3e81a&t=1693983965"


        ],
        icon:{
            "express":'https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%9B%BE%E6%A0%87/%E5%BF%AB%E9%80%92.svg?sign=44379d85057f4978741b92dcbbdc7285&t=1693983613',
            "developing":'https://7363-school2service-0gp1dcf9a73528f4-1318358380.tcb.qcloud.la/%E5%9F%BA%E6%9C%AC%E5%9B%BE%E7%89%87/%E5%9B%BE%E6%A0%87/%E5%BC%80%E5%8F%91%E4%B8%AD%20(1).svg?sign=ac47ecaad05045b2a44fac4bf724c6d6&t=1693983835'
        },
        page: 0,

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        app.check_locked();
        let that = this;
        wx.getStorage({
            key: 'openid',
            success(res) {
                console.log(res.data)
                //把缓存的openid赋给全局变量openid
                app.globalData.openid = res.data;

            },
            fail(er) {
                console.log('第一次进来')
                //第一次进来没有这个openid缓存，可以获取存进去
                //获取用户的_openid
                that.get_openid();
            }
        })
    },

    get_openid: function () {
        let that = this;
        //调用云函数，获取用户的_openid
        wx.cloud.callFunction({
            name: 'login',     //要调用的函数名
            data: {},                //要传给login云函数的数据
            success: function (res) {
                console.log(res.result.openid)
                app.globalData.openid = res.result.openid;
                //把openid放到缓存里面
                wx.setStorage({
                    key: "openid",
                    data: res.result.openid
                })

            },
            fail() {
                //提示用户获取openid失败
                wx.showToast({
                    title: '获取openid失败',
                    icon: 'none',
                    duration: 2000
                })
            }

        })
    },
    //跳转到帮我买、帮我送、帮我取、代取快递、代取外卖、其他跑腿
    go: function (e) {
        console.log(e.currentTarget.dataset.id)
        wx.navigateTo({
            url: e.currentTarget.dataset.id,
        })
    },
    //待开发
    developing_func: function () {
        let that = this;
        wx.showToast({
            title: '开发中，请耐心等待~',
            icon: 'loading',
            duration: 4000
        })

    },

    check_locked: function () {
        if(app.globalData.system_locked){
            wx.showToast({
                title: '系统已锁定！',
                icon: 'none',
                duration: 0
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
        app.check_locked();
        if (typeof this.getTabBar === 'function' &&
            this.getTabBar()) {
            this.getTabBar().init()
        }
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
        //触底了就触发gengduo函数，去获取更多数据
        this.gengduo();
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})