// pages/qu/qu.js
// 引入地图SDK核心类
var QQMapWX = require('../../util/qqmap-wx-jssdk.js');
// 实例化API核心类
var qqmapsdk = new QQMapWX({
    key: 'PBFBZ-Y3D66-JUWSY-M2MNG-MI2EZ-SPBBY' // 必填
});
const app = getApp();
const db = wx.cloud.database();


Page({

  /**
   * 页面的初始数据
   */
  data: {
    show_delivery_sites: false,  // 控制弹窗显示
    showActionSheet:false ,

    selected_site: null,  // 记录选中的快递站点
    express_site_index:-1,
    delivery_sites: [   // 取件站点
      
    ],
    selectedExpressSize:"",
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
        subname: '你抱着都很费劲的大玩意',
        value: 2
      },
      {
        name: "超大的",
        subname:"电竞椅那种超大的家伙",
        value:3
      },
      {
        name:"test",
        subname:"test",
        value:4
      }
    ],
    express_size:-1,
    pick_up_code:'',  //取件码或者快递单号
    remarks:'',  //用户评论
    final_cost:999,
    prices:[2,4,8,12,0],

    // 地址信息
    address:{
      "delivery_period":'',
      "recipient":'',
      "dormitory":'',
      "phone":''
    },
    // delivery_period:'',
    // recipient:'',
    // dormitory:"",
    // phone:'',


    express:'',
    
    polyline: [],
    distance:0,
    duration:0,
    
    start_location:'',
    end_location:'',
    
    start_latitude:'',
    start_longitude:'',
    end_latitude:'',
    end_longitude:'',
    no_jisuan:false,

    starttime_show:false,
    endtime_show:false,
    start_time:'请选择取件时间',
    end_time:'请选择送达时间',
    minDate:new Date().getTime(),
    cost:3,
    error_red:false,
    notes:'',
    checked:false,
    user_parse:false,
    balance:0,
    user_id:'',
    note_counts:0,
    fileList:[],
    linshi:[],  //存放图片的临时地址
  },
  // 选择快递站点
  selectDeliverySite(e) {
    const index = e.currentTarget.dataset.index;
    const selected_site = this.data.delivery_sites[index];
    this.setData({
      selected_site,
      show_delivery_sites: false,  // 关闭弹窗
      express_site_index:index,

    });
    console.log("选择了：",this.data.selected_site)
    // 这里你可以进一步处理 selected_site，比如存储或发送给服务器
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
        this.initDeliverySites();
        
        this.init_address();


        let that = this;
        if(options.id){
          wx.setNavigationBarTitle({
            title: '代取快递'
          })
         }
        //获取校区
        that.get_campus();
        //获取余额
        that.get_balance();
        //查询是否有自己发布的未确认的订单，如果有，则跳转确认，如果没有可以继续发布
        that.get_publish();
        


  },
  // 获取的时候注意权限的设置
  initDeliverySites: function() {
    db.collection('express_sites').get().then(res => {
      // console.log('获取集合成功: ', res);
      // res.data 包含该记录的数据
      if (res.data.length > 0) {
        this.setData({
          delivery_sites: res.data
        });
        
      }
      // console.log("get delivery_sites:",this.data.delivery_sites)
    }).catch(err => {
      console.error('获取集合失败', err);
    });
    console.log("delivery_sites:",this.data.delivery_sites)
  },
  // 加载个人地址
  init_address: function() {
    let that = this;
    if (app.globalData.dizhi) {
      that.setData({
        address: app.globalData.dizhi
      });
      console.log("address:", this.data.address);
    } else {
      console.log("app.globalData.dizhi is not initialized");
    }

  },
  // 选择快递站点
  showDialog() {
    this.setData({
      show_delivery_sites: true
    });
    console.log("弹出快递站点选择框")
  },
  showActionSheet(){
    this.setData({
      showActionSheet:true
    });
    console.log("弹出选择快递大小窗口")
  },


  // 选择快递大小
  onSelectAction(event) {
    const { value } = event.detail;
    const selected = this.data.select_express_size_actions[value].name; // 直接从数组中获取名称
    const price = this.data.prices[value];
  
    this.setData({
      showActionSheet: false,
      selectedExpressSize: selected,
      final_cost: price,
      express_size: value,
    });
  
    console.log("express_size:", this.data.express_size);
    console.log("selectedExpressSize=", this.data.selectedExpressSize);
    console.log("price=", price);
  },
  
    // 上传图片
    uploadToCloud(event) {
      let that = this;
     
      wx.chooseImage({
        count: 9,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success (res) {
          wx.showLoading({
            title: '正在上传',
          })    
          console.log(res)
          that.setData({
            linshi:that.data.linshi.concat(res.tempFilePaths)
          })
          console.log(that.data.linshi)
          //临时数组
          let lujin = "bangmai_img/" + new Date().getTime() +"-"+ Math.floor(Math.random() * 1000);
          const uploadTasks = that.data.linshi.map((item, index)  =>  that.uploadFilePromise(lujin+index, item)); //传给wx.cloud.uploadFile的cloudPath属性的值不能重复！！！巨坑，加个index就可以避免重复了
            Promise.all(uploadTasks)
            .then(data => {
              console.log(data)
              wx.hideLoading()
              wx.showToast({ 
                title: '上传成功', 
                icon: 'none' 
              });
              const newFileList = data.map(item => ({ url: item.fileID,isImage: true,}));
              console.log(newFileList)
              //每次上传成功后，都要清空一次临时数组，避免第二次重复上传，浪费存储资源，
              that.setData({ 
                fileList: that.data.fileList.concat(newFileList),
                linshi:[],
              });
              
            })
            .catch(e => {
              wx.showToast({ title: '上传失败', icon: 'none' });
              console.log(e);
            });
      
        }
      })
      
     
  },
   //上传到云存储，并且获得图片新路径
    uploadFilePromise(fileName, chooseResult) {
      return wx.cloud.uploadFile({
        cloudPath: fileName,
        filePath: chooseResult
      });
    },
  //预览图片
  previewImage:function(event){
    let that = this;
    console.log(event)
    wx.previewImage({
      urls: [event.currentTarget.dataset.url] // 需要预览的图片http链接列表
    })    
  },
  //删除图片
  delete:function(event){
    let that = this;
    console.log(event)
    let inde = event.currentTarget.dataset.id
    //删除数组里面的值
    that.data.fileList.splice(inde,1)
    that.setData({
        fileList:that.data.fileList,
    })
  },

  get_publish:function(){
    let that = this;
    db.collection('publish').where({
        state:5,
        _openid:app.globalData.openid,
    }).get({
       success:function(res){
          if(res.data.length==0){
            //没有则不做任何弹窗处理
            console.log('没有待确认的订单')
          }else{
            //如果还有未确认订单，则跳转确认页面
            wx.showModal({
              title: '提示',
              content: '您还有未确认的订单，请先确认',
              showCancel:false,
              confirmText:'前往确认',
              success (res) {
                if (res.confirm) {
                  console.log('用户点击确定')
                  wx.switchTab({
                    url: '/pages/fabu/fabu',
                  })
                } else if (res.cancel) {
                  console.log('用户点击取消')
                }
              }
            })
            
          }
          
       },
       fail(er){

       }
    })
  },
  //获取钱包余额
  get_balance:function(){
    let that = this;
    db.collection('user').where({
       _openid:app.globalData.openid,
    }).get({
      success:function(res){
        //用户不存在于user表里，则添加
        if(res.data.length==0){
            db.collection('user').add({
                  data:{
                    balance:0,
                  },
                  success:function(r){
                     console.log('添加balance字段成功')
                     //成功添加，不做任何处理
                    
                  },
                  fail(){
                    // 不成功，就退出此页面，防止使用钱包支付时候出错
                     wx.showToast({
                      title: '发送错误，请重试',
                      icon: 'none',
                      duration: 2000
                     })
                     setTimeout(function(){
                        wx.navigateBack({
                          delta: 0,
                        })
                     },1000)
                  }
            })
        }
        //用户存在于user表里
        if(res.data.length!==0){
          console.log(res.data[0].balance)
          that.setData({
              balance:res.data[0].balance,
              user_id:res.data[0]._id,
          })
        }
      }
   })
  },
  //跳转充值页面
  go_parse:function(){
    let that = this;
    wx.navigateTo({
      url: '/pages/recharge/recharge',
    })
  },
  //获取线路，并且计算距离
  get_xianlu(e) {
    var that = this;
    wx.showLoading({
      title: '正在获取',
    })
    //调用接口
    qqmapsdk.direction({
      mode: 'bicycling',//可选值：'driving'（驾车）、'walking'（步行）、'bicycling'（骑行），不填默认：'driving',可不填
      //from参数不填默认当前地址
      from:{
        latitude: that.data.start_latitude,
        longitude: that.data.start_longitude,

      },
      to:{
        latitude: that.data.end_latitude,
        longitude: that.data.end_longitude,
      },
      success: function (res) {
        console.log(res);
        
        var ret = res;
        var coors = ret.result.routes[0].polyline, pl = [];
        //坐标解压（返回的点串坐标，通过前向差分进行压缩）
        var kr = 1000000;
        for (var i = 2; i < coors.length; i++) {
          coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr;
        }
        //将解压后的坐标放入点串数组pl中
        for (var i = 0; i < coors.length; i += 2) {
          pl.push({ latitude: coors[i], longitude: coors[i + 1] })
        }
        console.log(pl)
        //设置polyline属性，将路线显示出来,将解压坐标第一个数据作为起点
        that.setData({
          latitude:pl[0].latitude,
          longitude:pl[0].longitude,
          polyline: [{
            points: pl,
            color: '#FF0000DD',
            width: 4
          }],
          distance:res.result.routes[0].distance,
          duration:res.result.routes[0].duration,
        })
        wx.hideLoading()
        if(that.data.user_parse&&that.data.balance>=that.data.cost){
          //使用钱包支付，先获取线路和计算距离，再调用parse_pay函数
          that.parse_pay();
          
        }
        if(!that.data.user_parse){
          //使用微信支付
          that.pay();
        }
        
        
      },
      fail: function (error) {
        console.error(error);
        wx.hideLoading()
        wx.showToast({
          title: '获取失败，请重试',
          icon: 'none',
          duration: 2000
        })
        
      },
      
    });
  },

  //取件码或者快递单号
  onChange_pick_up_code:function(event){
    let that = this;
    that.setData({
       pick_up_code:event.detail,
    })
    console.log(that.data.pick_up_code)
  },


  onChange_remarks:function(event){
    let that = this;
    that.setData({
      remarks:event.detail,
    })
    console.log("remarks",that.data.remarks)
  },
  
  //是否使用余额支付
  onChange_userparse:function(event){
    let that = this;
    console.log(event.detail)
    that.setData({
       user_parse:event.detail,
    })
  },
// 检查是否是纯数字
isNumeric: function(str) {
  return /^[0-9]+$/.test(str);
},

// 检查对象的每一个属性是否为空
isEmpty: function(obj) {
  for (let key in obj) {
    if (obj[key] === '' || obj[key] === -1) {
      return true;
    }
  }
  return false;
},
  ////////////////
  //检查各个输入是否都已经输入
  onSubmit:function(){
    let that = this;
    // 检查地址字段
    console.log("地址:",this.data.address)
    if (this.isEmpty(this.data.address)) {
      wx.showToast({
        title: '收件信息是空的啊',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    // 检查取件码是否为纯数字
    if (!this.isNumeric(this.data.pick_up_code)) {
      wx.showToast({
        title: '取件码应该是纯数字',
        icon: 'none',
        duration: 2000
      });
      return false;
    }

    // 检查快递大小
    if (this.data.express_size === -1) {
      wx.showToast({
        title: '快递规格忘了选吧',
        icon: 'none',
        duration: 2000
      });
      return false;
    }
    if(that.data.selected_site==null){
      wx.showToast({
        title: '快递站点没告诉我',
        icon: 'none',
        duration: 2000
      })
      return false;
    }
    console.log("提交数据库")
    that.add_order_form()
    // if(that.data.user_parse&&that.data.balance<that.data.cost){
    //   wx.showModal({
    //     title: '提示',
    //     content: '余额不足，请充值',
    //     success (res) {
    //       if (res.confirm) {
    //         console.log('用户点击确定')
    //         wx.redirectTo({
    //           url: '/pages/parse/parse',
    //         })
    //       } else if (res.cancel) {
    //         console.log('用户点击取消')
    //       }
    //     }
    //   })
    //   return false;
    // }
    // if(that.data.user_parse&&that.data.balance>=that.data.cost){
    //   that.parse_pay();
    // }
    // if(!that.data.user_parse){
    //    //使用微信支付
    //    that.subscribeMessage();
    // }
  },
  //使用钱包支付
  parse_pay:function(){
    let that = this;
    //这里采用事务，因为需要三个操作同时成功或者同时失败
    //第一个是减去钱包余额，第二是消费记录写入history数据库表，第三是写入publish数据库表
    console.log(that.data.user_id)
    console.log(app.globalData.openid)
    wx.showLoading({
      title: '正在支付',
    })
    wx.cloud.callFunction({
      name:'parse_pay',
      data:{
          user_id:that.data.user_id,
          cost:that.data.cost,
          name:'帮我取订单支付',
          stamp:new Date().getTime(),
          
      },
      success:function(res){
            console.log(res)
            //成功，则先获取抽成费率,再存入数据库
            if(res.result.success){
                that.get_rate();
            }
            //如果失败，则提示重试
            if(!res.result.success){
              wx.hideLoading()
              wx.showToast({
                title: '发布错误，请重试',
                icon: 'none',
                duration: 2000
              })
            }
           
            
      },
      fail(er){
        console.log(er)
      }
    })

  },
  //使用微信支付
  pay:function(){
    let that = this;
    wx.showLoading({
      title: '正在支付',
    })
    let dingdan_hao = Date.now().toString()+Math.floor(Math.random()*1000).toString()
    wx.cloud.callFunction({
      name: 'pay',  //云函数的名称，在后面我们会教大家怎么建
      data:{
          body:'优我帮-帮我取任务费用',
          outTradeNo:dingdan_hao,
          totalFee:that.data.cost,
          nonceStr:'5K8264ILTKCH16CQ2502SI8ZNMTM67VS'
      },
      success: res => {
        console.log(res)
        const payment = res.result.payment
        wx.hideLoading();
        wx.requestPayment({
          ...payment,           //...这三点是 ES6的展开运算符，用于对变量、数组、字符串、对象等都可以进行解构赋值。
          success (res) {
            console.log('支付成功', res)
            wx.showLoading({
              title: '正在完成',
            })
            //支付成功后，先获取抽成费率，再添加到publish数据库
            that.get_rate();
            let nian = new Date().getFullYear();
            let yue = new Date().getMonth()+1;
            let ri = new Date().getDate();
            let shi = new Date().getHours();
            let fen = new Date().getMinutes();
            //支付成功后，调用paysuc云函数发布订单支付成功提醒
            wx.cloud.callFunction({
              name:'paysuc',
              data:{
                trade_name:'优我帮-帮我取订单',
                cost:(that.data.cost).toString(),   //转成字符串
                payment_method:'微信支付',
                time:nian+'年'+yue+'月'+ri+'日'+' '+shi+':'+fen,
                dingdan_hao:dingdan_hao,
                
              },
              success:function(re){
                   console.log(re)
              },
              fail(e){
                 console.log(e)
              }
            })

          },
          fail (err) {
            console.error('支付失败', err) //支付失败之后的处理函数，写在这后面

          }
        })
      },
      fail: console.error,
    })
  },
  //请求获取发送订阅消息的权限
  subscribeMessage() {
    let that = this;
    wx.requestSubscribeMessage({
      tmplIds: [
        "HtZ_mS0WpFwT8AQAE72xrDKFWWoIle5OzJ83VYfwu5E",//订阅消息模板ID，一次可以写三个，可以是同款通知、到货通知、新品上新通知等，通常用户不会拒绝，多写几个就能获取更多授权
      ],
      success(res) {
        console.log("订阅消息API调用成功：",res)
        if(!that.data.no_jisuan){
          //使用钱包支付，先获取线路和计算距离，再调用parse_pay函数
          that.get_xianlu();
        }
        if(that.data.no_jisuan){
          that.pay();
        }
        
        
      },
      fail(res) {
        console.log("订阅消息API调用失败：",res)
      }
    })
  },
  //把输入的信息提交到publish数据库表
  add_order_form:function(e){
    let that = this;
    // 用于订单记录，骑手查看
    db.collection('order_form').add({
       data:{
          //类型
          category:'pick_up',
          // 快递站点
          selected_site:that.data.selected_site.title,
          express_site_index:that.data.express_site_index,
          // 取件信息
          delivery_period:that.data.address.delivery_period,
          recipient:that.data.address.name,
          dormitory:that.data.address.dormitory,
          phone:that.data.address.phone,
          pick_up_code:that.data.pick_up_code,
          selectedExpressSize:that.data.selectedExpressSize,
          // 留言
          remarks:that.data.remarks,
          // 订单状态
          order_state:false,
          // 金额
          cost:that.data.final_cost,
          // 订单创建时间
          created_time:new Date().getTime(),
       },
       success:function(res){
            wx.hideLoading()
            wx.showToast({
              title: '发布成功',
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
        wx.showToast({
          title: '发布失败',
          icon: 'fail',
          duration: 2000
        })
         //存入数据库失败处理
        // wx.showModal({
        //   title: '提示',
        //   content: '发布失败',
        //   confirmText:'联系客服',
        //   showCancel:false,
        //   success (res) {
        //     if (res.confirm) {
        //       console.log('用户点击确定')
        //       wx.navigateTo({
        //         url: '/pages/kefu/kefu',
        //       })
        //     } else if (res.cancel) {
        //       console.log('用户点击取消')

        //     }
        //   }
        // })
       }
    })
    // 订单记录，用户查看
    
  },
  //获取后台的抽成费率
  get_rate:function(){
    let that = this;
    db.collection('campus').where({
         campus_name:that.data.choose_campus,
    }).get({
      success:function(res){
           console.log(res.data[0].rate)
           let rate = 1-res.data[0].rate
          // 把抽成费率传给add_publish函数进行增加数据处理
          let cost = (rate*that.data.cost).toFixed(1)
          let costs = parseFloat(cost)
           that.add_publish(costs)
      }
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
    this.init_address();
  },
  
  
  go_bushouhuo:function(){
    let that = this;
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