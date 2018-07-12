/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var config = {
    port: process.env.PORT || 3001,
    database : 'mongodb://localhost:27017/elle',
    // database : {
    //     username: "mongoAdminBIT",
    //     password: "BiT^7129~jsQ​-P",
    //     authDb: "admin",
    //     port: 27017,
    //     host: "127.0.0.1",
    //     dbName: "cashback"
    // },
    secret : 'Afv2ilj0iaT1@sB6r345-ipn0ilu9maI-Tn2n9eR',
    dev_mode : true,
    __site_url: 'http://162.243.110.92:3434/',
    email: {  
        host: 'smtp.gmail.com',
        user: 'abhishek.brainium@gmail.com',
        pass: 'ovcek@12335',
        adminEmail: 'abhishek.brainium@gmail.com',
        port: 587
    },
     status: {
        OK: 200,
        CREATED: 201,
        FOUND: 302,
        BAD_REQUEST: 400,
        NOT_AUTHORIZED: 401,
        PAYMENT_REQUERED: 402,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        SERVER_ERROR: 500,
        NO_SERVICE: 503
    }
};
module.exports = config;

