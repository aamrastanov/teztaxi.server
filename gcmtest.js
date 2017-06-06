/**
 * Created by a.amrastanov on 12.12.2014.
 */

var mes = process.argv[2];
var gcm = require('node-gcm');

var GCMService = {
    sender: new gcm.Sender('AIzaSyDhpknxMq3XiKywfkeW-iYIH3ZA5VS9KJc')
};
var data = {action: mes};
var message = new gcm.Message({
    collapseKey: "super puper",
    delayWhileIdle: false,
    timeToLive: 1,
    data: data
});
console.log("sending", data);
GCMService.sender.send(message, ["APA91bGQ6KnUn2JX635pmfFm2Nn7rhl8T-RS9BPAfAkrxHnsNhoA5fwWfKYJCdoAQIyb6k3z0OdjfJV9VLVJgBjj3UoTrCqJJqWRw6YvdBSJi1HFiReqRattrBRTg-pGrBPK2BzfqUXmdSTZ6SxQhFGIzC3KYTnbSQ"], 1, function (err, result) {
    if (err){
        console.log("GSM send error", err);
    }
    else{
        console.log("GSM send success", result);
    }
});
