var async = require('async');
//var uuid = require('node-uuid');
//var FCM = require('fcm-node');
//var moment = require('moment');
var User = require('../../models/user');
var request = require('request');
var config = require('../../config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//var nodemailer = require('nodemailer');
//var hbs = require('nodemailer-express-handlebars');
var secretKey = config.secret;
//var jwt = require('jsonwebtoken');
//var fs = require('fs');
//var moment = require('moment');
var randomString = require('randomstring');
//require('mongoose-pagination');


var transporter = nodemailer.createTransport('smtps://' + config.email.user + ':' + config.email.pass + '@' + config.email.host);
transporter.use('compile', hbs({viewPath: 'templates', extName: '.hbs'}));

var serverKey = config.push.serverKey; //put your server key here
var fcm = new FCM(serverKey);

function createToken(user) {
    var tokenData = {
        id: user._id,
        email: user.email
    };
    var token = jwt.sign(tokenData, secretKey, {
        expiresIn: "2 days"
    });
    return token;
}

var UserMethods = {

    verify_email: function (userData, callback) {
        User.count({email: userData.email, _id: userData.token}, function (err, cnt) {
            if (cnt > 0) {
                var conditions = {email: userData.email, _id: userData.token},
                        fields = {email_verify: 'yes'},
                        options = {multi: true};

                User.update(conditions, fields, options, function (err, affected) {
                    if (err) {
                        callback({success: false, message: "some internal error has occurred", err: err});
                    } else {
                        callback({success: true, message: 'Your Email successfully verified'});
                    }
                });
            } else {
                callback({success: false, message: 'your email verification expired'});
            }
        });
    },

    registerUser: function (userData, callback) {

        console.log("Data : ",userData);
        async.waterfall([
            function (nextcb) {
                var errMsg = "";
                if (userData.email) {
                    var email = userData.email.toLowerCase();
                    User.count({email: email,user_type:userData.user_type}, function (err, cnt) {
                        if (err) {
                            nextcb(err,null);
                        } else {
                            if (cnt > 0) {
                                errMsg = "Email already exist";
                            }
                            nextcb(null, errMsg);
                        }
                    });
                } else {
                   nextcb(null, errMsg);
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    if (userData.phone) {
                     User.count({phone: userData.phone,user_type:userData.user_type}, function (err, cnt) {
                        if (err) {
                            nextcb(err);
                        } else {
                            if (cnt > 0) {
                                errMsg = "Contact no already exist";
                            }
                            nextcb(null, errMsg);
                        }
                     });
                    } else {
                        nextcb(null,errMsg);
                    }
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                   if(!userData.email && !userData.phone) {
                    errMsg = "Email or Contact No is required";
                   }
                   nextcb(null, errMsg);
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    if (!userData.user_type) {
                        var errMsg = "User type is required";
                        nextcb(null, errMsg);
                    } else {
                        nextcb(null, errMsg);
                    }
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    if (userData.user_type == 'Merchant' && !userData.country) {
                        var errMsg = "Country is required";
                        nextcb(null, errMsg);
                    } else {
                        nextcb(null, errMsg);
                    }
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    if (userData.user_type == 'Merchant' && !userData.language) {
                        var errMsg = "Language is required";
                        nextcb(null, errMsg);
                    } else {
                        nextcb(null, errMsg);
                    }
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    if (userData.user_type == 'Merchant' && !userData.business_name) {
                        var errMsg = "Business name is required";
                        nextcb(null, errMsg);
                    } else {
                        nextcb(null, errMsg);
                    }
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    if (typeof (userData.password) == "undefined" || userData.password == "") {
                        errMsg = "Password can't be blank";
                    } else if ((userData.password.length) < 6) {
                        errMsg = "Password length should be minimum six";
                    }
                    nextcb(null, errMsg);
                }
            },
            function (cErr, nextcb) {
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    //userData.dob = userData.dob.toUTCString();
                    userData.email = userData.email.toLowerCase();
                    var user = new User(userData);
                    user.save(function (err, res) {
                        if (err) {
                            nextcb(err);
                        } else {
                        //===========start sent mail=================
                        var URL = require('url-parse');
                        var link = new URL(config.__site_url + 'api/verify_email?email=' + userData.email + '&token=' + res._id);
                        var base_url = config.__site_url;
                        //send mail with options

                        transporter.sendMail({

                            from: '"Recom2u"',
                            to: userData.email,
                            subject: 'Recom2u - Email Verification',
                            template: 'email_template',
                            context: {
                                name: userData.name,
                                url: link,
                                base_url: base_url
                            }

                        }, function (err, response) {
                            if (err) {
                                console.log("Email Error : ",err);
                            } else {
                                console.log("Email Send Success : ",response);
                            }
                        });
                        callback({success: true, message: "Successfully resgistered.A verification mail has been sent to your email address.Please check your mail and activate your account",_user:res._id});
                        }
                    });
                }
            }
        ], function (err, validationError) {
            if (err) {
                callback({success: false, message: "some internal error has occurred", err: err});
            } else if (validationError != "") {
                callback({success: false, message: validationError});
            } else {
            }
        });
    },

    facebookRegister: function (userData, callback) {
        async.waterfall([
            function (nextcb) {
                var errMsg = "";
                if (!userData.facebook_id) {
                    errMsg = "Facebook ID is required";
                    nextcb(null, errMsg);
                } else {
                    nextcb(null, errMsg);
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    if (!userData.user_type) {
                        errMsg = "User Type is required";
                        nextcb(null, errMsg);
                    } else {
                        nextcb(null, errMsg);
                    }
                }

            },
            // function (cErr, nextcb) {
            //     var errMsg = "";
            //     if (cErr != "") {
            //         nextcb(null, cErr);
            //     } else {
            //         if (!userData.country) {
            //             var errMsg = "Country is required";
            //             nextcb(null, errMsg);
            //         } else {
            //             nextcb(null, errMsg);
            //         }
            //     }
            // },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    if (!userData.language) {
                        var errMsg = "Language is required";
                        nextcb(null, errMsg);
                    } else {
                        nextcb(null, errMsg);
                    }
                }
            },
            function(cErr, nextcb){
              var errMsg = "";
               if (cErr != "") {
                    nextcb(null, cErr);
               } else {
                    if(userData.email){
                        var email = userData.email.toLowerCase();
                        User.count({email: email}, function (err, cnt) {
                            if (err) {
                                nextcb(err);
                            } else {
                                if (cnt > 0) {
                                    errMsg = "Email Already Exists";
                                }
                                nextcb(null, errMsg);
                            }
                        });
                    } else {
                        nextcb(null, errMsg);
                    }
               }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    if (userData.phone) {
                     User.count({phone: userData.phone}, function (err, cnt) {
                        if (err) {
                            nextcb(err);
                        } else {
                            if (cnt > 0) {
                                errMsg = "Contact no already exist";
                            }
                            nextcb(null, errMsg);
                        }
                     });
                    } else {
                        nextcb(null,errMsg);
                    }
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                   if(!userData.email && !userData.phone) {
                    errMsg = "Email or Contact No is required";
                   }
                   nextcb(null, errMsg);
                }
            },
            function (cErr, nextcb) {
                var errMsg = "";
                var saveData = {};
                if (cErr != "") {
                    nextcb(null, cErr);
                } else {
                    userData.email_verify = 'yes';
                    userData.device_token = userData.device_token;
                    var user = new User(userData);
                    user.save(function (err, show) {
                        if (err) {
                            callback({success: false, message: "Error while saving", Error: err});
                        } else {
                            var token = createToken(show);
                            callback({
                                success: true,
                                message: "Successfully resgistered.You can now login by tapping the facebook button",
                                userid: show._id,
                                token: token,
                                email:show.email,
                                name:show.name,
                                profile_pic:show.profile_pic,
                            });
                        }
                    });
                }
            }

        ], function (err, validationError) {
            if (err) {
                callback({success: false, message: "some internal error has occurred", err: err});
            } else if (validationError != "") {
                callback({success: false, message: validationError});
            } else {
            }
        });
    },

    fbLogin: function (userData, callback) {
        console.log("fbLoginData : ",userData);
        if (!userData.facebook_id) {
            callback({success: false, message: 'Facebook id is required'});
        } else {
            User.findOne({facebook_id: userData.facebook_id}, function (err, cnt) {
                if(err) {
                    callback({success: false, Error: err});
                } else {
                   if(cnt){
                        if(!userData.device_token){
                            cnt.last_login = Date.now();
                        } else {
                            cnt.device_token = userData.device_token;
                            cnt.last_login = Date.now();
                        }
                        cnt.save(function (err, updatedUser) {
                            if(err){
                                callback({success: false, message: "Error while updating UserSchema"});
                            } else {
                                var token = createToken(cnt);
                                callback({
                                    success: true,
                                    msg: 'Successfully loggedin',
                                    userid: updatedUser._id,
                                    name: updatedUser.name,
                                    business_name: updatedUser.business_name,
                                    type:updatedUser.user_type,
                                    profile_pic: updatedUser.profile_pic,
                                    token: token
                                });
                            }
                        });
                   } else {
                     callback({success: false,message:"Account does not exist"});
                   }
                }
            });
        }
    },

    doLogin: function (reqData, userAgents, callback) {
        console.log("reqData : ",reqData);
        if (!reqData.email) {
            callback({success: false, message: "Email address or Contact no is required"});
        } else if (!reqData.password) {
            callback({success: false, message: "Password is required"});
        } else {
            User.findOne({ $and: [
                  { user_type: reqData.user_type},
                  { $or:[{email:reqData.email}, {phone:reqData.email}] }
                ]
            })
                .select('name user_type business_name profile_pic email password email_verify')
                .exec(function (err, user) {
                    if (err) {
                        callback({success: false, message: "some internal error has occurred", err: err});
                    } else {
                        if (!user) {
                            callback({success: false, message: "Invalid Email Id"});
                        } else {
                            if(!user.password){
                                callback({success: false, message: "Try to login anothet way"});
                            } else if (!user.comparePassword(reqData.password)) {
                                callback({success: false, message: "invalid password"});
                            } else if (user.email_verify == 'no') {
                                callback({success: false, message: "Please verify your email id and activate your account"});
                            } else {
                                var UAParser = require('ua-parser-js');
                                var parser = new UAParser();
                                //console.log(ua_str);
                                //var ua = req.headers['user-agent'];     // user-agent header from an HTTP request
                                var uaObj = parser.setUA(userAgents);
                                //console.log(uaObj);
                                //console.log(uaObj.getOS());
                                var user_agent = uaObj.getResult();
                                //console.log(typeof(user_agent));



                                //var hasnewpassword =  bcrypt.hashSync(reqData.password);

                                //=========== Updating user record ===========//
                                var conditions = {_id: user._id};
                                if(!reqData.device_token){
                                    var fields = {
                                        user_agent: user_agent,
                                        last_login: Date.now()
                                    };
                                } else {
                                    var fields = {
                                        user_agent: user_agent,
                                        device_token: reqData.device_token,
                                        last_login: Date.now()
                                    };
                                }

                                var options = {upsert: false};

                                User.update(conditions, fields, options, function (err, affected) {
                                    if (err) {
                                        callback({success: false, message: "some internal error has occurred", err: err});
                                    } else {
                                        var token = createToken(user);
                                        callback({
                                            success: true,
                                            message: "Successfully loggedin",
                                            userid: user._id,
                                            name: user.name,
                                            business_name: user.business_name,
                                            type:user.user_type,
                                            profile_pic: user.profile_pic,
                                            token: token,
                                            email:user.email
                                        });
                                    }
                                });
                            }
                        }
                    }
                });
        }
    },

   subscription_plans:function(callback){
    Plan.find(function (err, result) {
        if (err) {
            callback({success: false, err: err});
        } else {
            callback({success:true,plans: result});
        }
    })
   },

   categoryList:function(callback){
      Category.find(function (err, result) {
        if (err) {
            callback({success: false, error: err});
        } else {
            callback({success:true,categories: result});
        }
      })
   },

   update_profilepic: function(userid, fileData, callback){
        if(!userid){
            callback({success: false, message: "userId is required"});
        } else {

            if(!fileData){
                callback({success: false, message: "No file selected"});
            } else {
            // The name of the input field (i.e. "profile_pic") is used to retrieve the uploaded file
            var profileImage = fileData.fileName;
           
             //var ext = profileImage.name.slice(profileImage.name.lastIndexOf('.'));
             var ext = '.jpg';
             var fileName = Date.now() + ext;
             var imagePath = 'public/uploads/profilepic/'+fileName;
             var profileimageUrl = config.__site_url + 'public/uploads/profilepic/' + fileName+'?dim=90x100';
            // mv() method to place the file somewhere on your server
              profileImage.mv(imagePath, function(err) {
                if (err){
                  callback({success: false, message: "File uploading error", err: err});
                } else {
                    User.update({_id : userid}, { $set: { profile_pic: profileimageUrl }}, function (err, user) {
                      if (err) {
                        callback({success: false, message: "some error occurred", err: err});
                      } else {
                        callback({
                             success: true,
                             message: "Image updated successlully",
                             profimage:profileimageUrl
                        });
                      }
                    });
                }
              });
            }
        }
    },

   define_campaign:function(userData,userid, callback){

        if(!userData.paymentId) {
            callback({success: false, message: "Payment is not made!"});
        } else {
            Campaign.findOne({_user:userid},function(err,campaign){
                if(err){
                 callback({success: false, message: err});
                } else {
                    if(campaign){
                        campaign.remove();
                    } 
                    userData._user = userid;
                    userData.status = 'active';
                    userData.expire_date = moment().add(userData.duration, 'month').format('YYYY-MM-DD');
                    var campaign = new Campaign(userData);
                    campaign.save(function (err, res) {
                        if (err) {
                           callback({success: false, message: err});
                        } else {
                           callback({success: true, message: "Campaign created successfully",data:res});
                        }
                    }) 
                }
            })
        }
    },

    campaignDetails:function(merchantId, callback){
      if(!merchantId){
        callback({success: false, message: "Merchant id is required",flag:'error'});
      } else {
        var d = new Date();
        //var n = d.toISOString();
        Campaign.findOne({
            "_user":merchantId
        },function(err,response){
          if (err) {
             callback({success: false, error: err, flag:'error'});
          } else {
            if(response){
            
              if((d < response.expire_date) && response.status == 'active') {
                callback({success: true,campaign:response,flag:'active'});
              } else if((d < response.expire_date) && response.status == 'inactive'){
                callback({success: false,message:"Campaign is inactive",flag:'inactive'});
              } else {
                  callback({success: false,message:"Campaign has expired",flag:'expired'});
              } 

            } else {
                callback({success: false,message:"Campaign not created yet",flag:'undefined'});
            }
          }
        })
      }
    },

    profileDetails:function(userid, callback){
      if(userid) {
        User.findById(userid,function(err,user){
          if (err) {
             callback({success: false, message: err});
          } else {
             callback({success: true,user:user});
          }
        })
      } else {
        callback({success: false, message: "UserId is required"});
      }
    },

    update_user:function(userid,updateData,callback){
       if(userid){
          User.findById(userid, function (err, user) {
            if (err) {
              callback({success: false, message: err});
            } else {
              user.name = updateData.name;
              user.business_name = updateData.business_name;
              user.business_description = updateData.business_description;
              user.category = updateData.category;
              user.save(function (err, updatedUser) {
                if (err) {
                  callback({success: false, message: err});
                } else {
                  callback({success: true,message:"User updated successfully!"});
                }
              });
            }
          });
       } else {
         callback({success: false, message: "UserId is required"});
       }
    },

    transaction_history:function(userid, callback){
      if(userid){
        Campaign
             .find({_user:userid})
             .select('paymentId paymentAmount Paymentenvironment paymentDate')
             .exec(function(err,transaction){
          if (err) {
             callback({success: false, message: "Error while fatching transaction history data",error: err});
          } else {
             callback({success: true,data:transaction});
          }
        })
      } else {
        callback({success: false, message: "UserId is required"});
      }
    },

    message_admin:function(data, callback){
      if(data.sender && data.message){
        
        User.findById(data.sender,function(err,user){
          if (err) {
             callback({success: false, message: "Error while saving message",error: err});
          } else {
             if(user){

              //============Find AdminID================
            
              User.findOne({"user_type":"Admin"}, function(err,admin){
                 if (err) {
                    callback({success: false,error: err,message:"Error"});
                    return;
                 } else {
                        var messageData = {
                          sender:data.sender,
                          message:data.message,
                          receiver:admin._id
                        }
                        var message = new Message(messageData);
                        message.save(function (err, res) {
                          if (err) {
                             callback({success: false, message: err});
                          } else {
                             callback({success: true, message: "Message sent successfully",data:res});
                          }
                        })
                 }
              })
               
            } else {
               callback({success: false, message: "Sender does not exist"});
            }
          }
        })
      } else {
        callback({success: false, message: "Message is required"});
      }
    },

    SearchMerchant:function(searchData,userid, callback){

      var resultSet = []
      var cond = [{user_type:"Merchant"}];
      if(searchData.name) {
          var regexName = new RegExp(["", searchData.name].join(""), "i");
          cond.push({ $or:[{'business_name':regexName}, {'name':regexName}]});
      }
      if(searchData.category) {
        var regex = new RegExp(["", searchData.category].join(""), "i");
        cond.push({category:regex});
      }

      //console.log("SearchQuery : ",searchData.business_name);
      User.find({$and: cond})
          .paginate(1, 20)
          .exec(function(err,merchants){
            if (err) {
               callback({success: false, error: err});
            } else {
              async.each(merchants,function(mer,cb){
                 console.log()
                 RequestTobeRecommender.findOne({_merchant:mer._id,_recommender:userid},function(err,isRequested){
                   resultSet.push({
                       "_id": mer._id,
                       "name": mer.name,
                       "business_name": mer.business_name,
                       "business_description":mer.business_description,
                       "category":mer.category,
                       "email": mer.email,
                       "profile_pic":(!mer.profile_pic)?'assets/img/user.png':mer.profile_pic,
                       "country":mer.country,
                       "lat":mer.lat,
                       "lng":mer.long,
                       "isRequested" : (!isRequested)?false:true,
                       "isAccepted": (isRequested)?isRequested.isAccepted:null
                   })
                   cb();
                 })

              },function(err){
                  if(err){
                      callback({success: false, error: err});
                  } else {
                      callback({success: true,merchants:resultSet});
                  }
              })
               //callback({success: true,merchants:merchants});
            }
          })
    },

    searchMerchant_new:function(searchData,userid, callback){

      async.waterfall([
         
         function findMerchants(cb){
              
              var cond = [{user_type:"Merchant"}];
              if(searchData.name) {
                  var regexName = new RegExp(["", searchData.name].join(""), "i");
                  cond.push({ $or:[{'business_name':regexName}, {'name':regexName}]});
              }
              if(searchData.category) {
                var regex = new RegExp(["", searchData.category].join(""), "i");
                cond.push({category:regex});
              }

          User.find({$and: cond})
              .paginate(1, 10)
              .exec(function(err,merchants){
                if (err) {
                  cb(err);
                 } else {
                  cb(null,merchants);
                }
          })
        },

         function successfullRedeempCounter(merchants,cb){
           var resultSet = []; 
           async.each(merchants,function(mer,cb){
                OrderTransaction.count({
                  "_merchant":mer._id,
                  "redeemRequest":'A'
                },function(err,no){
                   if(err){
                        cb(err);
                        return;
                    } else {
                        //console.log("successfull_redemption_no : ",no);
                        resultSet.push({
                           "_id": mer._id,
                           "name": mer.name,
                           "business_name": mer.business_name,
                           "business_description":mer.business_description,
                           "category":mer.category,
                           "email": mer.email,
                           "profile_pic":(!mer.profile_pic)?'assets/img/user.png':mer.profile_pic,
                           "country":mer.country,
                           "lat":mer.lat,
                           "lng":mer.long,
                           "no_of_redeemption":no
                        })
                        cb(null,resultSet)
                    }
                })
                },function(err){
                    if(err){
                        cb(err);
                      } else {
                        cb(null,resultSet);
                    }
                })
         },

         function func2(merchants,cb){
            var resultSet = [];
            async.each(merchants,function(mer,cb){
                 
                RequestTobeRecommender.findOne({_merchant:mer._id,_recommender:userid},function(err,isRequested){
                   resultSet.push({
                       "_id": mer._id,
                       "name": mer.name,
                       "business_name": mer.business_name,
                       "business_description":mer.business_description,
                       "category":mer.category,
                       "email": mer.email,
                       "profile_pic": mer.profile_pic,
                       "country":mer.country,
                       "lat":mer.lat,
                       "lng":mer.lng,
                       "isRequested" : (!isRequested)?false:true,
                       "isAccepted": (isRequested)?isRequested.isAccepted:null,
                       "no_of_redeemption":mer.no_of_redeemption,
                       "referral":(isRequested)?isRequested.referral:null
                   })
                   cb(null);
                 })

            },function(err){
                  if(err){
                      cb(err);
                  } else {
                      cb(null,resultSet);
                  }
            })
         },

          function findisFavourite(merchants,cb){
            var resultSet = [];
            async.each(merchants,function(mer,cb){


                FavouriteList.findOne({"userid":userid,"fav_id":mer._id},function(err,isfav){

                    if(err){
                        cb(err,null);
                        return;
                    }
                     resultSet.push({
                       "_id": mer._id,
                       "name": mer.name,
                       "business_name": mer.business_name,
                       "business_description":mer.business_description,
                       "category":mer.category,
                       "email": mer.email,
                       "profile_pic": mer.profile_pic,
                       "country":mer.country,
                       "lat":mer.lat,
                       "lng":mer.lng,
                       "isRequested" : mer.isRequested ,
                       "isAccepted": mer.isAccepted,
                       "no_of_redeemption":mer.no_of_redeemption,
                       "isFav":(isfav)?true:false,
                       "referral":mer.referral
                   })
                   cb(null);
                })
                 
            },function(err){
                  if(err){
                      cb(err);
                  } else {
                      cb(null,resultSet);
                  }
            })
         },

         function findNoOfRecom(merchants,cb){
            var resultSet = [];
            async.each(merchants,function(mer,cb){
                Connection.count({_merchant:mer._id},function(err,count){
                   if(err) {
                    cb(err);return;
                   } else {
                    resultSet.push({
                       "_id": mer._id,
                       "name": mer.name,
                       "business_name": mer.business_name,
                       "business_description":mer.business_description,
                       "category":mer.category,
                       "email": mer.email,
                       "profile_pic":mer.profile_pic,
                       "country":mer.country,
                       "lat":mer.lat,
                       "lng":mer.lng,
                       "isRequested" : mer.isRequested ,
                       "isAccepted": mer.isAccepted,
                       "no_of_recom":count,
                       "no_of_redeemption":mer.no_of_redeemption,
                       "isFav":mer.isFav,
                       "referral":mer.referral
                   })
                    cb(null,resultSet);
                   }
                   
                })

            },function(err){
                  if(err){
                      cb(err);
                  } else {
                      cb(null,resultSet);
                  }
            })
         },

         function checkCampaignStatus(merchants,cb){
            var resultSet = [];
            async.each(merchants,function(mer,cb){
                Campaign.findOne({_user:mer._id},function(err,campaign){
                   if(err) {
                    cb(err);return;
                   } else {
                    resultSet.push({
                       "_id": mer._id,
                       "name": mer.name,
                       "business_name": mer.business_name,
                       "business_description":mer.business_description,
                       "category":mer.category,
                       "email": mer.email,
                       "profile_pic":mer.profile_pic,
                       "country":mer.country,
                       "lat":mer.lat,
                       "lng":mer.lng,
                       "isRequested" : mer.isRequested ,
                       "isAccepted": mer.isAccepted,
                       "no_of_recom":mer.no_of_recom,
                       "no_of_redeemption":mer.no_of_redeemption,
                       "isFav":mer.isFav,
                       "referral":mer.referral,
                       "campaign":(campaign)?campaign.status:null
                   })
                    cb(null,resultSet);
                   }
                   
                })

            },function(err){
                  if(err){
                      cb(err);
                  } else {
                      cb(null,resultSet);
                  }
            })
         }

        ],function(err, result){
           
           if(err){
            callback({success: false, message: "There is some error",error:err});
        } else {
            callback({success: true, merchants: result});
        }
      })
    },

    requestTobeRecommender:function(data, callback){

      if(!data.voucher){
        callback({success: false, message: "Voucher-ID is required"});
      } else if(!data._recommender){
        callback({success: false, message: "Recommennder id is required"});
      } else if(!data._merchant){
        callback({success: false, message: "Merchant id is required"});
      } else {
        //check if exist or not
        RequestTobeRecommender.count({
            "_merchant":data._merchant,
            "_recommender":data._recommender,
            "isAccepted":true
        },function(err, counter){
          if (err) {
             callback({success: false,message:"Error", error: err});
          } else {
             if(counter <= 0){

               if(!data.referral_fee && data.referral) {
               	 data.referral = null;
               }

               if(data.referral_fee && data.referral){
                 data.referral_commission_status = 'pending';
               }

               var req = new RequestTobeRecommender(data);
               req.save(function (err, data) {
                  if (err) {
                     callback({success: false, message: err});
                  } else {
                  	//===================Send Push Notification to Merchant==================
                  	 User.findById(data._merchant,function(err, merchant){
                  	 	if(err){
                  	 		callback({success: false, message: err});
                  	 		return;
                  	 	}

                  	 	var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                        to: merchant.device_token, 
                        //collapse_key: config.push.legacy_server_key,
                        
	                    notification: {
	                            title: 'New Recommender request', 
	                            body: 'New Recommender request received',
	                            sound:"default",
	                            click_action:"FCM_PLUGIN_ACTIVITY",
	                            icon:"ic_launcher" 
	                        },
	                        
	                        data: {  //you can send only notification or only data(or include both)
	                            flag:'requestTobeRecommender'
	                        }
	                    };
	                    
	                    fcm.send(message, function(err, response){
	                        if (err) {
	                            console.log("Something has gone wrong!",err);
	                        } else {
	                            console.log("Successfully sent with response: ", response);
	                        }
	                    });

                        //=============Also send mail to Merchant===================
                        User.findById(data._recommender,function(err, recomm){
                            if (err) {
                                console.log("Something has gone wrong!",err);
                            } else {
                                transporter.sendMail({
                                    from: '"Recom2u"',
                                    to: merchant.email,
                                    subject: 'Recom2u - New Recommender request received',
                                    template: 'common_template',
                                    context: {
                                        name: merchant.name,
                                        content:recomm.name+' has sent you a request to be recommender.'
                                    }

                                    }, function (err, response) {
                                        if (err) {
                                            console.log("Email Error : ",err);
                                        } else {

                                           //=============Send mail to Referral Recommender(if any)=====================
                                           if(data.referral_fee && data.referral) {
                                           	 User.findById(data.referral,function(err,referralRecom){
                                                if (err) {
                                                  console.log("Referral Recomm email sending Error : ",err);
                                                } else {
                                                   transporter.sendMail({
					                                    from: '"Recom2u"',
					                                    to: referralRecom.email,
					                                    subject: 'Recom2u - Referral Commission Request Awaiting...',
					                                    template: 'common_template',
					                                    context: {
					                                        name: referralRecom.name,
					                                        content:recomm.name+' has sent a Referral Commission request to '+ merchant.name +' of amount '+ data.referral_fee + '. On acceptence by Merchant you will earn Referral Commission of ' + data.referral_fee + ' Cash'
					                                    }

					                                    }, function (err, response) {
					                                        if (err) {
					                                            console.log("Email Error : ",err);
					                                        } else {
                                                                callback({success: true, message: "Request sent successfully!",data:data});
					                                        }
					                                });
                                                }
                                           	 })
                                           } else {
                                           	  callback({success: true, message: "Request sent successfully!",data:data});
                                           }
                                        }
                                });
                            }
                        }) 
                  	 })

                     
                  }
              })
             } else {
               callback({success: false,message:"Request already sent!"});
             }
          }
        })
      }
    },

    findRequestsTobeRecommender:function(merchantId, callback){
      if(!merchantId){
         callback({success: false, message: "Merchant id is required"});
      }  else {
        console.log("MerchantId : ",merchantId);
        RequestTobeRecommender.find({"_merchant":merchantId,"isAccepted":null})
                              .populate({
                                'path': '_recommender',
                                'select': 'name profile_pic'
                              })
                              .populate({
                                'path': 'referral',
                                'select': 'name profile_pic'
                              })
                              .sort({createdAt: -1})
                              .paginate(1, 10)
                              .lean()
                              .exec(function(err,data){
          if (err) {
             callback({success: false, message:"Error",error: err});
          } else {
             callback({success: true,requests:data,length:data.length});
          }
        })
      }
    },

    respondTorequestTobrRecommender:function(data, callback){

        RequestTobeRecommender.findById(data.reqId, function (err, result) {
           if (err) {
             callback({success: false, message: err});
           } else {
             if(result){
               result.isAccepted = data.response;
               result.referral_commission_status = (data.response === true)?'accepted':'rejected';
               result.save(function (err, updatedUser) {
                 if (err) {
                   callback({success: false,message:"Error", error: err});
                 } else {

                   //========================calculate Referral commission===============


        if(result.referral && result.referral_fee && (data.response === true)) {

		        var earning = null;
		        Campaign.findOne({"_user":result._merchant})
		                .exec(function(err,campaign){
		                	if (err) {
		                      callback({success: false, message: err});
		                      return;
		                    }

		        if(campaign){

	            	if(campaign.reward === 'Points') {
	                     earning = (parseInt(campaign.reward_details.point)/parseInt(campaign.reward_details.transaction_amount))*result.referral_fee;
	                } else if(campaign.reward === 'Percentage') {
	                     earning = (parseInt(result.referral_fee)*parseInt(campaign.reward_details.value))/100;
	                } else if(campaign.reward === 'Stamp') {
	                     earning = (parseInt(campaign.reward_details.stamp)/parseInt(campaign.reward_details.transaction_amount))*result.referral_fee;
	                } else if(campaign.reward === 'Multi Range') {
	                    if((result.referral_fee >= parseInt(campaign.reward_details[0].spend)) && (result.referral_fee < parseInt(campaign.reward_details[1].spend))) {
	                         earning = campaign.reward_details[0].redeem;
	                    } else if((result.referral_fee >= parseInt(campaign.reward_details[1].spend)) && (result.referral_fee < parseInt(campaign.reward_details[2].spend))){
	                         earning = campaign.reward_details[1].redeem;
	                    } else if((result.referral_fee >= parseInt(campaign.reward_details[2].spend)) && (result.referral_fee < parseInt(campaign.reward_details[3].spend))){
	                         earning = campaign.reward_details[2].redeem;
	                    } else if((result.referral_fee >= parseInt(campaign.reward_details[3].spend)) && (result.referral_fee < parseInt(campaign.reward_details[4].spend))){
	                         earning = campaign.reward_details[3].redeem;
	                    } else if((result.referral_fee >= parseInt(campaign.reward_details[4].spend)) && (result.referral_fee < parseInt(campaign.reward_details[5].spend))){
	                         earning = campaign.reward_details[4].redeem;
	                    } else {
	                         earning = campaign.reward_details[4].redeem;
	                    }
	                }

		            var Obj = {
		                 voucher:result.voucher,
		                 amount:result.referral_fee,
		                _merchant:result._merchant,
		                _recommender:result.referral,
		                 reward:campaign.reward,
		                 unit:campaign.redeem_method,
		                 earning:earning,             // modified as on 06.04.2018
		                 isAccepted:'A'
		            };

		            var ot = new OrderTransaction(Obj);
		            ot.save(function (err, data) {
		                if (err) {
		                   callback({success: false, message: err});
		                } else {
		                    //===========send Referral an email==============
		                    User.findById(result.referral,function(err,referral){
		                      if (err) {
		                        callback({success: false, message: err});
		                      } else {
		                        transporter.sendMail({
		                            from: '"Recom2u"',
		                            to: referral.email,
		                            subject: 'Recom2u - Referral Commission Request approved',
		                            template: 'common_template',
		                            context: {
		                                name: referral.name,
		                                content:'You have earned Referral Commission of amount '+ earning
		                            }

		                            }, function (err, response) {
		                                if (err) {
		                                    console.log("Email Error : ",err);
		                                } else {
		                                    console.log("Email Send Success : ",response);
		                                    //callback({success: true, message: "Order transaction request has sent"});
		                                }
		                            });
		                      }
		                    })
		                }
		            })  
		        }

		        })

            }

                   // ==========Send Mail and push notification to Recom===========
                   
                    User.findById(result._recommender,function(err, recomm){
                  	 	if(err){
                  	 		callback({success: false, message: err});
                  	 		return;
                  	 	}

                  	 	var message = { 
                        to: recomm.device_token, 
                        //collapse_key: config.push.legacy_server_key,
	                    notification: {
	                            title: (data.response)?'Request has accepted':'Request has declined', 
	                            body: (data.response)?'Your request to be Recommender has been accepted':'Your request to be Recommender has been declined',
	                            sound:"default",
	                            click_action:"FCM_PLUGIN_ACTIVITY",
	                            icon:"ic_launcher" 
	                        },
	                        
	                        data: {
	                        	last_text: (data.response)?'Your request to be Recommender has been accepted':'Your request to be Recommender has been declined',
	                            flag:'responseTobeRecommender'
	                        }
	                    };
                        

                        //=============Send mail to Recom===================
                        User.findById(result._merchant,function(err, mrchnt){
                            if (err) {
                              console.log("Something has gone wrong!",err);
                            } else {
                              let mssgg = (data.response)?'accepted':'declined'; 
                              transporter.sendMail({
                                from: '"Recom2u"',
                                to: recomm.email,
                                subject: 'Recom2u - New Recommender request received',
                                template: 'common_template',
                                context: {
                                    name: recomm.name,
                                    content:mrchnt.name+' has '+mssgg+' your request to be Recommender '
                                }

                                }, function (err, response) {
                                    if (err) {
                                        console.log("Email Error : ",err);
                                    } else {
                                        //==========PUSH NOTIFICATION===========
                                        fcm.send(message, function(err, response){
                                            if (err) {
                                                console.log("Something has gone wrong!",err);
                                            } else {
                                                console.log("Successfully sent with response: ", response);   
                                            }
                                        });
                                       console.log("Email Send Success : ",response);
                                    }
                               });
                            }
                        })
                  	 })

                   if(data.response){

                    Connection.count({
                        _merchant:result._merchant,
                        _recommender:result._recommender,
                    },function(err,count){
                        if (err) {
                           callback({success: false, message: err});
                        } else {
                            if(count <= 0) {
                                //=======Add to Connection List==========
                                     var connObj = {
                                        _merchant:result._merchant,
                                        _recommender:result._recommender,
                                        _request:result._id
                                     };
                                     var conn = new Connection(connObj);
                                     conn.save(function (err, data) {
                                        if (err) {
                                           callback({success: false, message: err});
                                        } else {
                                           callback({success: true, message: "Request accepted successfully",data:data});
                                        }
                                    })
                            } else {
                                callback({success: true, message: "Already accepted "});
                            }
                        }
                    })

                   } else {
                     result.remove(function(err,del){
                        if(err){
                           callback({success: false, message: err});
                           return; 
                        }
                        callback({success: true, message: "Request declined successfully"});
                     });
                   }
                 }
               });
             } else {
                  callback({success: false,message:"Invalid request"});
             }
           }
         });
    },

    listMerchant:function(_recm,callback){
      if(!_recm){
        callback({success: false,message:"RecommenderID is required"});
      } else {
        var resultSet = [];
        User.find({'user_type':'Merchant'})
            .paginate(1, 10)
            .exec(function(err,merchants){
              if (err) {
                 callback({success: false, error: err});
              } else {
                async.each(merchants,function(mer,cb){
                   console.log()
                   RequestTobeRecommender.count({_merchant:mer._id,_recommender:_recm},function(err,isRequested){
                     resultSet.push({
                         "_id": mer._id,
                         "name": mer.name,
                         "business_name": mer.business_name,
                         "email": mer.email,
                         "profile_pic":mer.profile_pic,
                         "isRequested" : (isRequested > 0)?true:false
                     })
                     cb();
                   })

                },function(err){
                    if(err){
                        callback({success: false, error: err});
                    } else {
                        callback({success: true,merchants:resultSet});
                    }
                })
              }
            })
      }
    },

    message_list:function(userId,callback){
      if(!userId){
        callback({success: false, message: "UserId is required"});
      } else {
        var list = [];
        Message.find({$or:[{'sender':userId}, {'receiver':userId}]})
            .exec(function(err,msg){
              if (err) {
                 callback({success: false, error: err});
              } else {
                 msg.forEach(function (res, index) {
                    if(res.sender == userId) {
                      list.push({"class":"message right appeared",message:res.message})
                    } else {
                      list.push({"class":"message left appeared",message:res.message})
                    }
                });
                 callback({success: true,messages:list});
              }
        })
      }
    },

    findRecforMerchant:function(merchantId, callback){
       Connection.find({'_merchant':merchantId})
           .populate({
              'path': '_recommender',
              'select': 'name profile_pic'
           })
          .sort({createdAt: -1})
          .paginate(1, 10)
          .lean()
          .exec(function(err,results){
            if (err) {
               callback({success: false, error: err});
            } else {
               callback({success: true,recm:results});
            }
      })
    },

    searchRecforMerchant:function(search,loggedinUserId, callback){
       var regex = new RegExp(["", search].join(""), "i"); 
       User.find({
                   'name':regex,
                   'user_type':"Recommender",
                   '_id': { $ne: loggedinUserId } 
               })
           .select('_id name profile_pic')
           .paginate(1, 5)
           .sort({name: 1})
           .exec(function(err,results){
            if (err) {
               callback({success: false, error: err});
            } else {
                var list = [];
                results.forEach(function (res, index) {
                    list.push({_recommender:res})
                });
               callback({success: true,recm:list});
            }
      })
    },

    orderTransactionReq:function(recomId,params, callback){

       if(params) {
         if(!params.voucher){
            callback({success: false, message: "Voucher ID is required"});
         } else if(!params.amount){
            callback({success: false, message: "Transaction amount is required"});
         } else if(!params.merchantid){
            callback({success: false, message: "Merchant ID is required"}); 
         } else {
             
             //===========Check if any Order Transaction Request has already placed with the same voucherID======
            
            OrderTransaction.count({_merchant:params.merchantid,voucher:params.voucher},function(err,count){
               if(err){
                 callback({success: false, error: err});
               } else {
                 if(count > 0){
                    callback({success: false, message: "Invalid or used voucher"});
                 } else {

                    var Obj = {
                         voucher:params.voucher,
                         amount:params.amount,
                        _merchant:params.merchantid,
                        _recommender:recomId,
                    };

                    var ot = new OrderTransaction(Obj);
                    ot.save(function (err, data) {
                        if (err) {
                           callback({success: false, message: err});
                        } else {
                            //===========send merchant an email==============
                            User.findById(params.merchantid,function(err,mrchnt){
                              if (err) {
                                callback({success: false, message: err});
                              } else {
                                if(mrchnt.email){
                                    User.findById(recomId, function(err,recomm){
                                      if (err) {
                                        callback({success: false, message: err});
                                      } else {

                                        transporter.sendMail({
                                        from: '"Recom2u"',
                                        to: mrchnt.email,
                                        subject: 'Recom2u - Order Transaction Request Received',
                                        template: 'common_template',
                                        context: {
                                            name: mrchnt.name,
                                            content:recomm.name+' has sent you Order Transaction Request.'
                                        }

                                        }, function (err, response) {
                                            if (err) {
                                                console.log("Email Error : ",err);
                                            } else {
                                                console.log("Email Send Success : ",response);
                                                callback({success: true, message: "Order transaction request has sent"});
                                            }
                                        });
                                      }
                                    })
                                } 
                              }
                            })
                        }
                    })
                 }
                 
               }
            })
        }
       } else {
         callback({success: false, message: "No data provided"});
       }
    },

    findOrderTransactionReq:function(merchantId, callback){
       if(!merchantId){
         callback({success: false, message: "Merchant Id is required"});
       } else {
        var resultSet = [];
        OrderTransaction.aggregate([
            { "$match": {
                "isAccepted":"A",
                "_merchant":mongoose.Types.ObjectId(merchantId),
               }
            },
            {"$sort" : {createdAt: -1}},
            { "$group": { 
                "_id": "$_recommender",
                "amount": {$sum: "$amount"},
                "earning": {$sum: "$earning"},
                count: {$sum: 1}
                }
            },
         ],
        function(err,results) {
            if (err) {
              callback({success: false, error: err});
            } else {
              //callback({success: true,requests:results}); 
              async.each(results,function(res,cb){
                 User.findById(res._id,function(err,recom){
                   resultSet.push({
                       "recom_id": recom._id,
                       "name": recom.name,
                       "profile_pic":(!recom.profile_pic)?'assets/img/user.png':recom.profile_pic,
                       "amount":res.amount,
                       "earning":res.earning,
                       "count":res.count
                   })
                   cb();
                 })

              },function(err){
                  if(err){
                      callback({success: false, error: err});
                  } else {
                      callback({success: true,requests:resultSet});
                  }
              })   
            }
        })
       }
    },

    newOrderTransactionReqRcvd:function(merchantId, callback){
        if(!merchantId){
          callback({success: false, message: "Merchant Id is required"});
        } else {
         var list = [];   
         OrderTransaction.find({'_merchant':merchantId,"isAccepted":null})
           .populate({
              'path': '_recommender',
              'select': 'name profile_pic'
           })
          .sort({createdAt: -1})
          .exec(function(err,results){
            if (err) {
               callback({success: false, error: err});
            } else {
                results.forEach(function (res, index) {
                    list.push({
                        "_id":res._id,
                        "amount":res.amount,
                        "voucher":res.voucher,
                        "recom_id":res._recommender._id,
                        "name":res._recommender.name,
                        "profile_pic":res._recommender.profile_pic
                    })
                }); 
               callback({success: true,requests:list});
            }
         })
        }
    },

    respondToOTReq: function(merchantId,params, callback){

        OrderTransaction.findById(params.req_id,function(err, tank){
            if (err) {
               callback({success: false, error: err});
            } else {

                if(!tank){
                   callback({success: false, message: "No Order transaction found"});
                }  else {

              //======Calculate earning based on current campaign========
               
               Campaign.findOne({'_user':merchantId,'status':"active"}).exec(function(err, campaign){
                  if (err) {
                    callback({success: false, error: err});
                 } else {
                    console.log("campaign : ",campaign);
                    var earning = 0;
                    tank.isAccepted = params.isAccepted;
                    tank.reward = campaign.reward;

                    if(params.isAccepted == 'A' && campaign.reward === 'Points') {
                         earning = (parseInt(campaign.reward_details.point)/parseInt(campaign.reward_details.transaction_amount))*tank.amount;
                    } else if(params.isAccepted == 'A' && campaign.reward === 'Percentage') {
                         earning = (parseInt(tank.amount)*parseInt(campaign.reward_details.value))/100;
                    } else if(params.isAccepted == 'A' && campaign.reward === 'Stamp') {
                         earning = (parseInt(campaign.reward_details.stamp)/parseInt(campaign.reward_details.transaction_amount))*tank.amount;
                    } else if(params.isAccepted == 'A' && campaign.reward === 'Multi Range') {
                        if((tank.amount >= parseInt(campaign.reward_details[0].spend)) && (tank.amount < parseInt(campaign.reward_details[1].spend))) {
                             earning = campaign.reward_details[0].redeem;
                        } else if((tank.amount >= parseInt(campaign.reward_details[1].spend)) && (tank.amount < parseInt(campaign.reward_details[2].spend))){
                             earning = campaign.reward_details[1].redeem;
                        } else if((tank.amount >= parseInt(campaign.reward_details[2].spend)) && (tank.amount < parseInt(campaign.reward_details[3].spend))){
                             earning = campaign.reward_details[2].redeem;
                        } else if((tank.amount >= parseInt(campaign.reward_details[3].spend)) && (tank.amount < parseInt(campaign.reward_details[4].spend))){
                             earning = campaign.reward_details[3].redeem;
                        } else if((tank.amount >= parseInt(campaign.reward_details[4].spend)) && (tank.amount < parseInt(campaign.reward_details[4].spend))){
                             earning = campaign.reward_details[4].redeem;
                        } else {
                             earning = campaign.reward_details[4].redeem;
                        }
                    }
                    
                    tank.earning = Math.round(earning);
                    tank.unit = campaign.redeem_method;
                    console.log("Tank : ",tank);
                    tank.save(function (err, updatedTank) {
                     if (err) {
                        callback({success: false, error: err});
                     } else {

                        //=====send mail to Recomm============

                        User.findById(tank._recommender,function(err,recommn){
                           if (err) {
                             callback({success: false, error: err});
                            } else {
                                User.findById(tank._merchant, function(err,merchh){
                                    if (err) {
                                      callback({success: false, error: err});
                                    } else {
                
                                        let sub = (params.isAccepted == 'A')?'accepted':'declined';
                                        let content = merchh.name+' has '+ sub + ' your cashback request!';
                                        //console.log("EMAIL CONTENT : ",content);
                                        transporter.sendMail({
                                            from: '"Recom2u"',
                                            to: recommn.email,
                                            subject: 'Recom2u - Cashback Request is '+ sub,
                                            template: 'common_template',
                                            context: {
                                                name: recommn.name,
                                                content:content
                                            }

                                        }, function (err, response) {
                                            if (err) {
                                                console.log("Email Error : ",err);
                                            } else {
                                                console.log("Email Send Success : ",response);
                        callback({
                            success: true,
                            message:(params.isAccepted == 'A')?"Success! Recommender has earned "+updatedTank.earning+" "+updatedTank.unit+".":"Request rejected."
                        });
                                            }
                                        }); 
                                    }
                                })
                                
                            }
                        })
                     }
                    }); 
                   }
                 })
                }
               
            }
        })
    },

    recomEarning: function(recomId,merchantId, callback){
      if(!recomId){
        callback({success: false, message: "Recommender Id is required"});
      } else {
        OrderTransaction.aggregate([
            { "$match": {
                "_merchant":mongoose.Types.ObjectId(merchantId),
                "_recommender":mongoose.Types.ObjectId(recomId),
                "isAccepted":"A",
                "isRedeemed":"N"
               }
            },
            {"$sort" : {createdAt: -1}},
            { "$group": { 
                "_id": "$unit",
                "earning": {$sum: "$earning"},
                count: {$sum: 1}
                }
            }
         ],
        function(err,results) {
            if (err) {
              callback({success: false, error: err});
            } else {
              var list = [];  
              results.forEach(function (res, index) {
                console.log("Eraning : ",res);
                    list.push({
                        "_id":res._id,
                        "earning":Math.round(res.earning),
                        "count":res.count,
                    })
                });
              callback({success: true,requests:list});  
            }
        })
      }
    },

    totalRecomEarning: function(recomId, callback){
       if(!recomId){
        callback({success: false, message: "Recommender Id is required"});
       } else {
         OrderTransaction.aggregate([
            { "$match": {
                "_recommender":mongoose.Types.ObjectId(recomId),
                "isAccepted":"A",
                "isRedeemed":"N"
               }
            },
            {"$sort" : {createdAt: -1}},
            { "$group": { 
                "_id": "$unit",
                "earning": {$sum: "$earning"},
                count: {$sum: 1}
                }
            }
         ],
        function(err,results) {
            if (err) {
              callback({success: false, error: err});
            } else {
                 var list = [];  
              results.forEach(function (res, index) {
                console.log("Eraning : ",res);
                    list.push({
                        "_id":res._id,
                        "earning":Math.round(res.earning),
                        "count":res.count,
                    })
                });
              callback({success: true,requests:list});  
            }
        })
      }
    },

    sendRedeemRequest: function (recomId,params, callback){
        
       if(recomId && params.merchantId) {
           
        OrderTransaction.find({
            "_merchant":params.merchantId,
            "_recommender":recomId,
            "unit":params.unit,
            "redeemRequest":null
        },function(err, result){
          if (err) {
           callback({success: false, error: err});
          } else {
            if(result){
              async.each(result,function(res,cb){
                 OrderTransaction.findByIdAndUpdate(res._id, { $set: { redeemRequest: 'P',redeemRequestDate:new Date() }}, function (err, updatedOT) {
                      if (err) {
                        callback({success: false, error: err});
                      } else {
                        console.log("Updated");
                      }
                  });
                 cb(); 
              },function(err){
                  if(err){
                      callback({success: false, error: err});
                  } else {
                      // ======send a mail to marchent[16.02.2018]=======
                      User.findById(params.merchantId,function(err, result){
                         if(err) {
                            callback({success: false, error: err});
                         } else {
                            User.findById(recomId, function(err, recomm){
                                if(err) {
                                   callback({success: false, error: err});
                                } else {
                                   //===========start sent mail=================
                                   var URL = require('url-parse');
                       
                                   //send mail with options
                                    transporter.sendMail({
                                        from: '"Recom2u"',
                                        to: result.email,
                                        subject: 'Recom2u - Redeem Request Received',
                                        template: 'common_template',
                                        context: {
                                            name: result.name,
                                            content: recomm.name+' has sent you redeem request',
                                        }

                                    }, function (err, response) {
                                        if (err) {
                                            console.log("Email Error : ",err);
                                        } else {
                                            console.log("Email Send Success : ",response);
                                        }
                                    });
                                }
                            })
                            callback({success: true,message:"Redeem request sent successfully"});
                        }
                      })
                      
                  }
              })
            
               
            } else {
               callback({success: false,message:"There is nothing to redeem"});   
            }
          }
        })

        } else {
           callback({success: true,message:"MerchantID and RecommenderID both are required"}); 
        }
    },

    redeemRequest: function (recomId,params, callback){
        
       if(recomId && params.merchantId) {
           
        OrderTransaction.find({
            "_merchant":params.merchantId,
            "_recommender":recomId,
            "reward":params.reward,
            "isRedeemed":"N"
        },function(err, result){
          if (err) {
           callback({success: false, error: err});
          } else {
            if(result){
              async.each(result,function(res,cb){
                 OrderTransaction.findByIdAndUpdate(res._id, { $set: { isRedeemed: 'Y',redeemDate:new Date() }}, function (err, updatedOT) {
                      if (err) {
                        callback({success: false, error: err});
                      } else {
                        console.log("Updated");
                      }
                  });
                 cb(); 
              },function(err){
                  if(err){
                      callback({success: false, error: err});
                  } else {
                      callback({success: true,message:"Redeemed successfully"});
                  }
              })
            
               
            } else {
               callback({success: false,message:"No awards found"});   
            }
          }
        })

        } else {
           callback({success: true,message:"MerchantID and RecommenderID both are required"}); 
        }
    },

    orderTransactionList: function (merchantId,recomId, callback){

        if(merchantId && recomId){
            OrderTransaction.find({_merchant:merchantId,_recommender:recomId,isAccepted:'A'},function(err,results){
                if (err) {
                  callback({success: false, error: err});
                } else {
                  callback({success: true,requests:results});  
                }
            })
        } else {
            callback({success: true,message:"MerchantID and RecommenderID both are required"});
        }
    },

    redeemptionList: function (merchantId,recomId, callback){

        if(merchantId && recomId){
            OrderTransaction.find({_merchant:merchantId,_recommender:recomId,redeemRequest:'A',isRedeemed:'Y'},function(err,results){
                if (err) {
                  callback({success: false, error: err});
                } else {
                  callback({success: true,requests:results});  
                }
            })
        } else {
            callback({success: true,message:"MerchantID and RecommenderID both are required"});
        }
    },

    newRedeemRequestRcvd: function (merchantId, callback){

        if(merchantId){
            OrderTransaction.aggregate([
            { "$match": {
                "_merchant":mongoose.Types.ObjectId(merchantId),
                "redeemRequest":"P",
               }
            },
            {"$sort" : {createdAt: -1}},
            { "$group": { 
                "_id": "$_recommender",
                "amount": {$sum: "$amount"},
                "earning": {$sum: "$earning"},
                count: {$sum: 1}
                }
            }
         ],
            function(err,results) {
                if (err) {
                  callback({success: false, error: err});
                } else {
                var resultSet = [];
                async.each(results,function(res,cb){
                 User.findById(res._id,function(err,recom){
                   resultSet.push({
                       "recom_id": recom._id,
                       "name": recom.name,
                       "profile_pic":(!recom.profile_pic)?'assets/img/user.png':recom.profile_pic,
                       "amount":res.amount,
                       "earning":Math.round(res.earning),
                       "count":res.count
                   })
                   cb();
                })

                },function(err){
                      if(err){
                          callback({success: false, error: err});
                      } else {
                          callback({success: true,requests:resultSet});
                      }
                }) 

                  //callback({success: true,requests:results});  
                }
            })
        } else {
            callback({success: false,message:"MerchantID both are required"});
        }
    },

    respondToRedeemReq: function(merchantId,params, callback){
        
      
        OrderTransaction.find({
            "_merchant":merchantId,
            "_recommender":params.recom_id,
            "redeemRequest":'P'
        },function(err, result){
            if (err) {
               callback({success: false, error: err});
            } else {
               if(result){

                async.each(result,function(res,cb){
                 OrderTransaction.findByIdAndUpdate(res._id, { $set: { isRedeemed: 'Y',redeemDate:new Date(),redeemRequest:params.isAccepted }}, function (err, updatedOT) {
                      if (err) {
                        callback({success: false, error: err});
                      } else {
                        console.log("Updated");
                      }
                  });
                 cb(); 

                },function(err){
                  if(err){
                      callback({success: false, error: err});
                  } else {
                      var msg = (params.isAccepted == 'A')?'Accepted':'Declined';

                    //===========Send mail to recommn===============

                    User.findById(params.recom_id, function(err, recomm){
                       if(err){
                        callback({success: false, error: err});
                       } else {
                           User.findById(merchantId,function(err, merchant){
                              if(err){
                                callback({success: false, error: err});
                              } else {
                                transporter.sendMail({
                                    from: '"Recom2u"',
                                    to: recomm.email,
                                    subject: 'Recom2u - Redeem Request '+msg,
                                    template: 'common_template',
                                    context: {
                                        name: recomm.name,
                                        content: merchant.name+' has '+ msg + ' redeem request',
                                    }

                                }, function (err, response) {
                                    if (err) {
                                        console.log("Email Error : ",err);
                                        callback({success: false,message:"Error!"});
                                    } else {
                                        console.log("Email Send Success : ",response);
                                        callback({success: true,message:msg+" successfully"});
                                    }
                                });
                              }
                            })  
                       }
                    })  
                  }
              })
               } else {
                callback({success: false,message:"There is nothing to redeem"});
               }
            }
        })
    },

    EarningDetailsList:function(recomId,unit, callback){

        if(!recomId){
         callback({success: false, message: "Recommender Id is required"});
        } else {
           
         OrderTransaction.aggregate([
            { "$match": {
                "_recommender":mongoose.Types.ObjectId(recomId),
                "unit":unit,
                "isAccepted":"A",
                "isRedeemed" : "N"
               }
            },
            { "$group": { 
                "_id": "$_merchant",
                "earning": {$sum: "$earning"},
                "amount": {$sum: "$amount"},
                 count: {$sum: 1}
                }
            }
         ],
        function(err,results) {
            if (err) {
              callback({success: false, error: err});
            } else {
                
              var resultSet = [];
                async.each(results,function(res,cb){
                 User.findById(res._id,function(err,recom){
                   resultSet.push({
                       "merchant_id": recom._id,
                       "name": recom.name,
                       "business_name":recom.business_name,
                       "profile_pic":(!recom.profile_pic)?'assets/img/user.png':recom.profile_pic,
                       "amount":res.amount,
                       "earning":Math.round(res.earning),
                       "count":res.count,
                       "unit":unit
                   })
                   cb();
                })

                },function(err){
                      if(err){
                          callback({success: false, error: err});
                      } else {
                          callback({success: true,requests:resultSet});
                      }
                })  

            }
        })
      }

    },

    successfullRedeemptionList: function(merchantId, callback){
       
       if(!merchantId){
          callback({success: false, message: "MerchantId is required"});
        } else {
          OrderTransaction.aggregate([
            { "$match": {
                "_merchant":mongoose.Types.ObjectId(merchantId),
                "redeemRequest":"A",
               }
            },
            { "$group": { 
                "_id": "$_recommender",
                "earning": {$sum: "$earning"},
                "amount": {$sum: "$amount"},
                 count: {$sum: 1}
                }
            }],
          function(err,results) {
            if (err) {
              callback({success: false, error: err});
            } else {
                
              var resultSet = [];
                async.each(results,function(res,cb){
                 User.findById(res._id,function(err,recom){
                   resultSet.push({
                       "recom_id": recom._id,
                       "name": recom.name,
                       "profile_pic":(!recom.profile_pic)?'assets/img/user.png':recom.profile_pic,
                       "amount":res.amount,
                       "earning":Math.round(res.earning),
                       "count":res.count
                   })
                   cb();
                })

                },function(err){
                      if(err){
                          callback({success: false, error: err});
                      } else {
                          callback({success: true,requests:resultSet});
                      }
                })  

            }
          })
        }
    },

    markasFavourite: function(recomId,fav_id, callback){
        
        if(!fav_id){
            callback({success: false, message: "favourite Id is required"});
        } else {
            
            FavouriteList.findOne({"userid":recomId,"fav_id":fav_id},function(err,result){
                
                if(err){
                    callback({success: false, error: err});
                } else {
                    if(result){
                        //already added
                        result.remove(function(err){
                            if (err) {
                               callback({success: false, message: err});
                               return;
                            } 
                            callback({success: true, message: "Removed from favourite list",isFav:false});
                            
                        })
                    } else {
                        var Obj = {
                            userid:recomId,
                            fav_id:fav_id,
                        };
                        console.log("Obj : ",Obj);
                        var fav = new FavouriteList(Obj);
                        fav.save(function (err, data) {
                            if (err) {
                               callback({success: false, message: err});
                            } else {
                               callback({success: true, message: "Added to favourite list",isFav:true});
                            }
                        });
                    }     
                } 
            })

        }
    },

    favouriteList: function(recomId, callback){
        
        if(!recomId){
            callback({success: false, message: "RecommenderID is required"});
        } else {

          async.waterfall([

            function f1(cb){
               
               FavouriteList.find({"userid":recomId})
                    .populate({
                            'path': 'fav_id',
                            'select': 'name business_name email business_description user_type category profile_pic country lat long'
                          })
                    .sort([['user_type', 1]])
                    .exec(function(err,list){
                      if (err) {
                           cb(err,null);
                           return
                        } else {
                           console.log("LIST : ",list); 
                           cb(null,list);
                      }
               })
              
            },

            function f2(merchants,cb){
                
               var resultSet = []; 
               async.each(merchants,function(mer,cb){
                console.log("Mer : ",mer)
                OrderTransaction.count({
                  "_merchant":mer.fav_id._id,
                  "redeemRequest":'A'
                },function(err,no){
                   if(err){
                        cb(err);
                        return;
                    } else {
                      
                        resultSet.push({
                           "_id": mer.fav_id._id,
                           "name": mer.fav_id.name,
                           "business_name": mer.fav_id.business_name,
                           "user_type": mer.fav_id.user_type,
                           "business_description":mer.fav_id.business_description,
                           "category":mer.fav_id.category,
                           "email": mer.fav_id.email,
                           "profile_pic":(!mer.fav_id.profile_pic)?'assets/img/user.png':mer.fav_id.profile_pic,
                           "country":mer.fav_id.country,
                           "lat":mer.fav_id.lat,
                           "long":mer.fav_id.long,
                           "no_of_redeemption":no
                        })
                        cb(null,resultSet)
                    }
                })
                },function(err){
                    if(err){
                        cb(err);
                      } else {
                        cb(null,resultSet);
                    }
                })
            },

            function f3(merchants,cb){
             
             var resultSet = [];
             var recomArr = [];
             async.each(merchants,function(mer,cb){
                RequestTobeRecommender.count({_merchant:mer._id,isAccepted:true},function(err,count){
                   if(err) {
                    cb(err);return;
                   } else {
                    
                         resultSet.push({
                           "_id": mer._id,
                           "name": mer.name,
                           "business_name": mer.business_name,
                           "user_type": mer.user_type,
                           "business_description":mer.business_description,
                           "category":mer.category,
                           "email": mer.email,
                           "profile_pic":mer.profile_pic,
                           "country":mer.country,
                           "lat":mer.lat,
                           "long":mer.long,
                           "no_of_recom":count,
                           "no_of_redeemption":mer.no_of_redeemption,
                        })
                    
                   
                    cb(null,resultSet);
                   }
                   
                })

                },function(err){
                      if(err){
                          cb(err);
                      } else {
                          cb(null,resultSet);
                      }
                })
            },

            function f4(merchants,cb){
            	var resultSet = [];
	            async.each(merchants,function(mer,cb){
	                 
	                RequestTobeRecommender.findOne({_merchant:mer._id,_recommender:recomId},function(err,isRequested){
	                   resultSet.push({
	                       "_id": mer._id,
	                       "name": mer.name,
	                       "business_name": mer.business_name,
	                       "business_description":mer.business_description,
	                       "user_type": mer.user_type,
	                       "category":mer.category,
	                       "email": mer.email,
	                       "profile_pic": mer.profile_pic,
	                       "country":mer.country,
	                       "lat":mer.lat,
	                       "lng":mer.long,
	                       "isRequested" : (!isRequested)?false:true,
	                       "isAccepted": (isRequested)?isRequested.isAccepted:null,
	                       "no_of_redeemption":mer.no_of_redeemption,
	                       "referral":(isRequested)?isRequested.referral:null
	                   })
	                   cb(null);
	                })

	            },function(err){
	                  if(err){
	                      cb(err);
	                  } else {
	                      cb(null,resultSet);
	                  }
	            })
            },

            function findNoOfRecom(merchants,cb){
                var resultSet = [];
	            async.each(merchants,function(mer,cb){
	                Connection.count({_merchant:mer._id},function(err,count){
	                   if(err) {
	                    cb(err);return;
	                   } else {
	                    resultSet.push({
	                       "_id": mer._id,
	                       "name": mer.name,
	                       "business_name": mer.business_name,
	                       "business_description":mer.business_description,
	                       "user_type": mer.user_type,
	                       "category":mer.category,
	                       "email": mer.email,
	                       "profile_pic":mer.profile_pic,
	                       "country":mer.country,
	                       "lat":mer.lat,
	                       "lng":mer.lng,
	                       "isRequested" : mer.isRequested ,
	                       "isAccepted": mer.isAccepted,
	                       "no_of_recom":count,
	                       "no_of_redeemption":mer.no_of_redeemption,
	                       "referral": mer.referral
	                   })
	                    cb(null,resultSet);
	                   }
	                   
	                })

	            },function(err){
	                  if(err){
	                      cb(err);
	                  } else {
	                      cb(null,resultSet);
	                  }
	            })
            }

            ],function(err,result){
                if(err){
                    callback({success: false, message: "There is some error",error:err});
                } else {
                     callback({success: true, merchants: result});
                }
            })
        }
    },

    getRecomPosition: function(recomId, callback){

        if(recomId){
            User.findById(recomId)
                .select('lat long')
                .exec(function (err, position) {
                    if(err){
                        callback({success: false, error: err});
                    } else {
                        callback({success: true, position: position});
                    }
                })
        } else {
            callback({success: false, message: "Recommender ID is required"});
        }
    },

    sendReferralReq:function(referred_by,params, callback){

       if(params.referral && params.referral_fee) {

           RequestTobeRecommender.findOne({
            "_merchant" : params.merchant_id,
            "_recommender" : referred_by
           }, function(err, data){
            if (err) {
                callback({success: false, error: err});
            } else {
                if(data){

                  if(data.referral && data.referral_fee){
                  	callback({success: false, message: "Can not send Referral Request more than one time"});
                  	return;
                  }	

                  data.referral = params.referral;
                  data.referral_fee = params.referral_fee;
                  data.referral_commission_status = 'pending';
                  data.save(function (err, updatedTank) {
                    if (err) {
                        callback({success: false, error: err});
                    } else {
                        //=============Send mail to Merchant===================
                        User.findById(params.merchant_id,function(err, mrchnt){
                            if (err) {
                                callback({success: false, error: err});
                            } else {
                                User.findById(referred_by, function(err,recomm){
                                    if(err) {
                                     callback({success: false, error: err});
                                    } else {

                                      User.findById(params.referral,function(err,referral){
                                          if(err) {
                                           callback({success: false, error: err});
                                          } else {

                                            transporter.sendMail({
                                                from: '"Recom2u"',
                                                to: mrchnt.email,
                                                subject: 'Recom2u - New Referral request received',
                                                template: 'common_template',
                                                context: {
                                                    name: mrchnt.name,
                                                    content:recomm.name+' has sent you a Referral request of amount '+params.referral_fee + ' Cash on behalf of Referral '+referral.name
                                                }
                                            }, function (err, response) {
                                                if (err) {
                                                   callback({success: false, error: err});
                                                } else {

                                                   //=============Send mail to Referral Recommender=====================
                                                   
                                                   transporter.sendMail({
                                                        from: '"Recom2u"',
                                                        to: referral.email,
                                                        subject: 'Recom2u - Your Referral Commission is awaiting for approval',
                                                        template: 'common_template',
                                                        context: {
                                                            name: referral.name,
                                                            content:recomm.name+' has sent a Referral Commission request to '+ mrchnt.name +' of amount '+ params.referral_fee + '. On acceptence by Merchant you will earn Referral Commission of ' + params.referral_fee + ' Cash'
                                                        }
                                                    }, function (err, response) {
                                                        if (err) {
                                                            callback({success: false, error: err});
                                                        } else {
                                                            callback({success: true, message: "Referral Commission has sent successfully"});
                                                        }
                                                    });
                                                   
                                                   
                                                }
                                            });

                                          }
                                      })
                                    }
                                })
                            }
                        })  
                    }
                  });
                } else {
                   callback({success: false, message: "Can not sent request"}); 
                }
            }
        })

       } else {
                 callback({success: false, message: "Referral input is incorrect"});
       }
       
    },

    referralComissionRequestRcvd:function(merchantId,callback){

       RequestTobeRecommender.find({
        "_merchant":merchantId,
        "isAccepted" : true,
        "referral_commission_status":'pending'
       })
       .populate({
            'path': '_merchant',
            'select': 'name profile_pic'
          })
      .populate({
            'path': 'referral',
            'select': 'name email phone country profile_pic'
          })
       .exec(function(err, requests){
          if (err) {
            callback({success: false, error: err});
          } else {
            callback({success: true, requests: requests}); 
          }
       })
    },

    respondToReferralReq:function(params, callback){
        
        if(params.req_id && params.response){

           RequestTobeRecommender.findById(params.req_id, function (err, result) {
           if (err) {
             callback({success: false, message: err});
           } else {
             if(result){
               result.isAccepted = params.response;
               result.referral_commission_status = (params.response === true)?'accepted':'rejected';
               result.save(function (err, updatedUser) {
                 if (err) {
                   callback({success: false,message:"Error", error: err});
                 } else {

                   //===============calculate Referral commission======

                  if(result.referral && result.referral_fee && (params.response === true)) {
                       
                    var Obj = {
                         voucher:result.voucher,
                         amount:result.referral_fee,
                        _merchant:result._merchant,
                        _recommender:result.referral,
                         reward:'Cash',
                         unit:'Referral Commission',
                         earning:result.referral_fee,
                         isAccepted:'A'
                    };

                    var ot = new OrderTransaction(Obj);
                    ot.save(function (err, data) {
                        if (err) {
                           callback({success: false, message: err});
                        } else {
                            //===========send Referral an email==============
                            User.findById(result.referral,function(err,referral){
                              if (err) {
                                callback({success: false, message: err});
                              } else {
                                transporter.sendMail({
                                    from: '"Recom2u"',
                                    to: referral.email,
                                    subject: 'Recom2u - Referral Commission Request approved',
                                    template: 'common_template',
                                    context: {
                                        name: referral.name,
                                        content:'You have earned Referral Commission of amount '+ result.referral_fee
                                    }

                                    }, function (err, response) {
                                        if (err) {
                                            console.log("Email Error : ",err);
                                        } else {
                                            console.log("Email Send Success : ",response);
                                            callback({success: true, message: 'Request '+updatedUser.referral_commission_status});
                                        }
                                    });
                              }
                            })
                        }
                    })
                  } 
                 }
               });
             } else {
                  callback({success: false,message:"Invalid request"});
             }
           }
         });

       } else {
           callback({success: false, message: "RequestID is required"});
       }
        
    },

    referralRecomList:function(recomId, callback) {

        // ReferralCommision.find({"referred_by":recomId})
        //                   .populate({
        //                         'path': '_user',
        //                         'select': 'name profile_pic'
        //                       })
        //                   .populate({
        //                         'path': 'merchant_id',
        //                         'select': 'name business_name email phone country profile_pic'
        //                       })
        //                  .sort({createdAt: -1})
        //                  .exec(function(err,result){

        //   if (err) {
        //     callback({success: false, message: err});
        //   } else {
        //     callback({success: true, recommenders: result});
        //   }

        // })
        var resultSet = [];
        User.find({"user_type":"Recommender",'isBlock': false})
                    .sort({name: 1})
                    .exec(function(err,result){

          if (err) {
            callback({success: false, message: err});
          } else {


              async.each(result,function(res,cb){
                console.log("Mer : ",res)
                FavouriteList.count({
                  "userid":recomId,
                  "fav_id":res._id
                },function(err,no){
                   if(err){
                        cb(err);
                        return;
                    } else {
                      
                        resultSet.push({
                           "_id": res._id,
                           "name": res.name,
                           "profile_pic":res.profile_pic,
                           "email":res.email,
                           "isFav":(no>0)?true:false
                        })

                        cb(null,resultSet)
                    }
                })
                },function(err){
                    if(err){
                        callback({success: false, message: err});
                      } else {
                        callback({success: true, recommenders: resultSet});
                    }
                })

          }

        })

    },

    forgotPass: function (req_data, callback) {

        console.log(req_data);
        if(!req_data.email) {
            callback({success: false, message: "Email address is required"});
        } else {
            User.findOne({"email": req_data.email,"user_type":req_data.user_type})
                .exec(function (err, user) {
                    if (err) {
                        callback({success: false, message: "There is some error",error:err});
                    } else {
                        if (!user) {
                          callback({success: false, message: "Invalid Email address"});
                        } else {
                          var new_password = randomString.generate({length: 6, charset: 'numeric'});  
                          user.password = new_password;
                          user.save(function (err, updatedUser) {
                            if (err) {
                              callback({success: false, message: "There is some error",error:err});
                            } else {
                              //====Send mail to user ====
                                transporter.sendMail({

                                        from: '"Recom2u"',
                                        to: user.email,
                                        subject: 'Recom2u Password Recovery',
                                        template: 'forgot_password',
                                        context: {
                                            name:user.name,
                                            new_pass:new_password,
                                        }

                                }, function (err, response) {
                                        if (err) {
                                            callback({success: false, message: "There is some error",error:err});
                                        } else {
                                            console.log(response);
                                            callback({success: true, message: "Password has changed successfully.New password has been sent to your email address."});
                                        }
                                }); 
                            }
                          });
                        }
                        
                    }
            });
        }
    },

    unreadmessageCount : function(userId,callback){
        
       if(!userId){
         callback({success: false, message: "UserId is required"});
        } else {
        var list = [];
         Message.count({'receiver':userId,'isRead':0 })
            .exec(function(err,counter){
              if (err) {
                 callback({success: false, error: err});
              } else {
                 callback({success: true,msgCounter:counter});
              }
        })
      }

    },

    updateUnreadMessageStatus : function(userId,callback){
        
       if(!userId){
         callback({success: false, message: "UserId is required"});
        } else {
       
            Message.update({'receiver':userId,'isRead':0 }, {isRead:1}, {multi: true}, function(err, num) {
                  if (err) {
                     callback({success: false, error: err});
                  } else {
                     callback({success: true,message:"Status updated",number:num});
                  }
            });
            
      }

    },

    logout : function(userId,callback){
        
       if(!userId){
         callback({success: false, message: "UserId is required"});
        } else {
            User.findById(userId, function (err, tank) {
              if (err) {
                callback({success: false, error: err});
                return;
              }
              
              tank.device_token = '';
              tank.save(function (err, updatedTank) {
                if (err) {
                   callback({success: false, error: err});
                   return; 
                }
                callback({success: true,message:"Device token removed"});
              });
            });
            
      }

    },

    recomMerchantList : function(recom,callback){
        if(!recom){
          callback({success: false, message: "UserId is required"});
        } else {
          RequestTobeRecommender.find({
            '_recommender':recom,
            'isAccepted'  : true
          }).populate({
            'path': '_merchant',
            'select': 'name business_name email profile_pic'
          }).exec(function(err, data){
                if (err) {
                   callback({success: false, error: err});
                   return; 
                }
                //console.log("Data : ",data);
                callback({success: true,data:data});
          })
        }
    },

    recomOrderTransactionHistory : function(recom,callback){
        if(!recom){
          callback({success: false, message: "RecommenderId is required"});
        } else {
          OrderTransaction.find({
            '_recommender': recom,
            'isRedeemed'  : 'Y'
          }).populate({
            'path': '_merchant',
            'select': 'name business_name email profile_pic'
          }).exec(function(err, data){
                if (err) {
                   callback({success: false, error: err});
                   return; 
                }
                //console.log("Data : ",data);
                callback({success: true,data:data});
          })
        }
    },

    cronJOb : function(callback){
      async.waterfall([
        function findExpiredCampaigns(cb){
        	Campaign.find({expire_date: { $lt: new Date() },status: "active"})
        	.exec(function(err, campaigns){
               if (err) {
                 cb(err,null);return;
               } else {
               	 cb(null,campaigns);
               }
        	})
        },
        function updateCampaignStatus(campaigns,cb){
           async.each(campaigns,function(campaign,callback){
              campaign.set({ status: 'expired' });
              campaign.save(function (err, updatedCampaign) {
                if (err) {
                    callback(err,null);return
                } else {
                	console.log('1.Campaign status updated successfully');
                	callback(null,updatedCampaign);
                }
              }) 
           },function(err,data){
                if (err) {
                  cb(err,null);
                } else {
                  cb(null,campaigns);	
                }
           })
        },
        function findAllRecommenders(campaigns,cb){
        	async.each(campaigns, function(campaign,callback){
              RequestTobeRecommender.find({_merchant:campaign._user}).exec(function(err, recomms){
                 
                if (err) {
                    callback(err,null);return
                }
                //====2.Insert to Campaign History Table====
                        
                var history = new CampaignHistory({
                    merchant:campaign._user,
                    start_date:campaign.start_date,
                    expired_date:campaign.expire_date,
                    recommenders:recomms
                });

                history.save(function (err, history) {
                	if (err) {
                     callback(err);return;
                    } else {
                     console.log('2.Campaign history inserted successfully');	
                     callback(null);	
                    }
                })
              })
        	},function(err,data){
                if (err) {
                  cb(err,null);
                } else {
                  cb(null,campaigns);	
                }
           })
        },
        function findOrderTransactions(campaigns,cb){
            async.each(campaigns, function(campaign,callback){	
	        	OrderTransaction.find({_merchant:campaign._user})
	            .exec(function(err,ordrtransac){
                    if (err) {
                     cb(err,null);return;
                    } else {
                    	if(ordrtransac.length > 0) {
                    	//var othistory = new OrderTransactionHistory(ordrtransac);
	                    OrderTransactionHistory.insertMany(ordrtransac,function(err,othistorySave){
	                        if(err) {
	                            cb(err);return;
	                        } else {
	                          console.log('3.Ordertransaction history saved successfully');	
	                          callback(null,campaigns); 
	                        }
	                    })
	                  } else {
	                  	console.log('3.No Order Transaction history found')
	                  	callback(null,campaigns)
	                  }
                    }
	            })
            },function(err){
                if (err) {
                  cb(err,null);return;
                } else {
                  console.log("Campaign : ",campaigns)	
                  cb(null,campaigns);	
                }
            })
        },
        function deleteOrderTransactions(campaigns,cb){
          async.each(campaigns,function(campaign,callback){
            OrderTransaction.remove({_merchant:campaign._user}, function(err, otremove){
            if(err) {
                callback(err);return;
            }
	            console.log('4.Ordertransaction history deleted successfully');
	            callback(null,campaigns);
            }) 
          },function(err){
               if (err) {
                  cb(err,null);return;
                } else {
                  console.log("Campaign : ",campaigns)	
                  cb(null,campaigns);	
                }
          })
        }

      ],function(err,result){
        if(err){
            callback({success: false, message: "There is some error",error:err});
        } else {
             callback({success: true, merchants: result});
        }
      })	
    }

};
module.exports = UserMethods;
