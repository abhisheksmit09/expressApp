var express = require('express');
var router = express.Router();
var config = require('../config');
var secretKey = config.secret;

var UserMethods = require('./methods/UsersMethod');





router.get('/', function(req, res, next) {
  res.json({status: config.status.BAD_REQUEST,message:'Invalid end point'});
});

function checkToken(req, res, next){
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if(token){
        jwt.verify(token, secretKey, function(err, decoded){
            if(err){
                res.status(403).send({success: false, message: "Failed to authenticate"});
            }
            else{
                req.decoded = decoded;
                next();
            }
        });
    }else{
        res.status(403).send({success: false, message: "token required"});
    }
}

router.get('/isValidToken',checkToken,function(req, res){
  res.json({success:true,message:"Token is valid"});
})

//new line added;

router.get('/recomOrderTransactionHistory',checkToken,function(req, res){
  var loggedinUser = req.decoded.id;
  UserMethods.recomOrderTransactionHistory(loggedinUser, function(response){
        res.json(response);
  });  
})

// another comment



module.exports = router;
