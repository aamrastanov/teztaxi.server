/**
 * Created by Администратор on 21.07.2015.
 */

var token = "53_89f3c869211a43f1275450f0471b6201";
var userDB = require('db').clientDB;
userDB.getByToken(token, function (err, userData) {
    if (err) {
       console.log(err);
    }
    else {
        console.log('success', userData);
    }
});
