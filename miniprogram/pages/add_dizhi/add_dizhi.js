// pages/add_dizhi/add_dizhi.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    dormitory:['成园1幢', '成园2幢', '成园3幢', '成园4幢', '成园5幢', '成园6幢', '桃园1幢', '桃园2幢', '桃园3幢', '桃园4幢', '桃园5幢', '桃园6幢', '桃园7幢', '桃园8幢', '桃园9幢', '桃园10幢', '桃园11幢', '桃园12幢', '桃园13幢', '桃园14幢', '桃园15幢', '桃园16幢', '桃园17幢', '桃园18幢'],
    dormitory_show:false,
    choose_dormitory:'',
    name:'',
    phone:'',
    deliver_period:["下午",'晚上'],
    deliver_period_show:false,
    choose_deliver_period:'',
    openid:""
  },

  onLoad: function() {
    this.getOpenId();
  },

  getOpenId: function() {
    const that = this;
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        console.log('获取到的openid:', res.result.openid);
        that.setData({ openid: res.result.openid });
      },
      fail: err => {
        console.error('云函数调用失败：', err);
      }
    });
  },
  check:function(){
    let that = this;
    if(that.data.choose_dormitory==''){
      wx.showToast({
        title: '你的豪宅在哪里？',
        icon: 'none',
        duration: 2000
      })
      return false;
    }
    if(that.data.name==''){
      wx.showToast({
        title: '你叫什么名字？',
        icon: 'none',
        duration: 2000
      })
      return false;
    }
    if(that.data.phone==''){
      wx.showToast({
        title: '我怎么打给你？',
        icon: 'none',
        duration: 2000
      })
      return false;
    }
    if(!/^\d{11}$/.test(that.data.phone)) {
      // 正则表达式 ^\d{11}$ 的解释：
      // ^        表示开始
      // \d       表示一个数字
      // {11}     表示刚才那个数字出现了11次
      // $        表示结束
      wx.showToast({
        title: '手机号码需要是11位数字',
        icon: 'none',
        duration: 2000
      });
      return false;
    }    
    if(that.data.choose_deliver_period==''){
      wx.showToast({
        title: '你想什么时候拿？',
        icon: 'none',
        duration: 2000
      })
      return false;
    }
    that.add()

  },
  // 添加到数据库
  add:function(){
    let that = this;
    wx.showLoading({
      title: '正在添加',
    })
    db.collection('shippinp_address').add({
      data:{
        dormitory:that.data.choose_dormitory,
        name:that.data.name,
        phone:that.data.phone,
        delivery_period:that.data.choose_deliver_period,
        openid: that.data.openid,
        creat:new Date().getTime(),
      },
      success:function(res){

           wx.hideLoading()
           wx.showToast({
            title: '添加成功',
            icon: 'success',
            duration: 2000
          })
          setTimeout(function(){
            wx.navigateBack({
              delta: 0,
            })
          },1000)
      },
      fail(er){
           wx.hideLoading()
           wx.showToast({
            title: '添加地址失败',
            icon: 'none',
            duration: 2000
          })
      }
    })
  },
  //获取用户输入的收件人
  onChange_name:function(event){
  let that = this;
  that.setData({
      name:event.detail,
  })
  console.log("set name:",that.data.name)
},
  onChange_phone:function(event){
    let that = this;
  that.setData({
      phone:event.detail,
  })
  console.log("set phone:",that.data.phone)
  },
  // 选择宿舍的下拉窗
  //打开选择宿舍窗口
  popup_dormitory:function(){
    let that = this;
    console.log("popup dormitory")
    that.setData({
      dormitory_show:true,
    })
  },
  //监听选择宿舍变化
  dormitory_change:function(event){
       let that = this;
       console.log(event)

       that.setData({
         choose_dormitory:event.detail.value
       })
       console.log("choose_dormitory:",that.data.choose_dormitory)
  },
  //取消选择宿舍
  dormitory_cancel:function(){
    let that = this;
    //关闭选择宿舍窗口
    that.setData({
      dormitory_show:false,
    })
  },
  //确定宿舍选择
  dormitory_confirm:function(){
    let that = this;
    //关闭选择宿舍窗口
    that.setData({
      dormitory_show:false,
    })
  },
// 选择配送时段的下拉窗
  //打开选择配送时段窗口
  popup_deliver_period:function(){
    let that = this;
    console.log("popup deliver_period")
    that.setData({
      deliver_period_show:true,
    })
  },
  //监听选择配送时段变化
  deliver_period_change:function(event){
       let that = this;
       console.log(event)
       that.setData({
         choose_deliver_period:event.detail.value
       })
  },
  //取消选择配送时段
  deliver_period_cancel:function(){
    let that = this;
    //关闭选择配送时段窗口
    that.setData({
      deliver_period_show:false,
    })
  },
  //确定配送时段选择
  deliver_period_confirm:function(){
    let that = this;
    //关闭选择配送时段窗口
    that.setData({
      deliver_period_show:false,
    })
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