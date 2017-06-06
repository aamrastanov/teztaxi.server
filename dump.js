/**
 * Created by a.amrastanov on 14.07.2015.
 */

var http = require('http');

var postData = JSON.stringify({
    'l' : 'dump',
    'p' : 'dump089',
    'command' : 'dump'
});

var options = {
    hostname: '127.0.0.1',
    port: 4455,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

var req = http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
    });
});

req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
});

req.write(postData);
req.end();
