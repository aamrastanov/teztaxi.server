/**
 * Created by a.amrastanov on 13.07.2015.
 */

function getAllClientData(){
    var users = require('userHandler').clientHandler.getAllUsers();
    var clientData = "clients\n\n";
    for(var index = 0; index < users.length; index ++){
        clientData += JSON.stringify(users[index].getJsonValue()) + "\n\n";
    }
    return clientData;
}

function getAllTaksistData(){
    var users = require('userHandler').taksistHandler.getAllUsers();
    var taxiData = "taksists\n\n";
    for(var index = 0; index < users.length; index ++){
        taxiData += JSON.stringify(users[index].getJsonValue()) + "\n\n";
    }
    return taxiData;
}

function getAllIssueData(){
    var issues = require('issueHandler').getAllIssues();
    var issueData = "issues\n\n";
    for(var index = 0; index < issues.length; index ++){
        issueData += JSON.stringify(issues[index]) + "\n\n";
    }
    return issueData;
}

function getAllOrderData(){
    var orders = require('orderHandler').getAllOrders();
    var orderData = "orders\n\n";
    for(var index = 0; index < orders.length; index ++){
        orderData += JSON.stringify(orders[index]) + "\n\n";
    }
    return orderData;
}

function handleDump(command, response){
    var out = require("out");
    if (command == 'dump'){
        var fs = require('fs-plus');
        var dumpDir = fs.getTimeDir('log/dump-');
        fs.writeFile(dumpDir, 'clients.txt', getAllClientData(), function(err){
           if (err){
               response.writeHead(200);
               response.write("Dump failed." + JSON.stringify(err));
               out.connectionsInfo("Dump failed." + JSON.stringify(err));
               response.end();
           }
           else{
               fs.writeFile(dumpDir, 'taksists.txt', getAllTaksistData(), function(err){
                   if (err){
                       response.writeHead(200);
                       response.write("Dump failed." + JSON.stringify(err));
                       out.connectionsInfo("Dump failed." + JSON.stringify(err));
                       response.end();
                   }
                   else{
                       fs.writeFile(dumpDir, 'issues.txt', getAllIssueData(), function(err){
                           if (err){
                               response.writeHead(200);
                               response.write("Dump failed." + JSON.stringify(err));
                               out.connectionsInfo("Dump failed." + JSON.stringify(err));
                               response.end();
                           }
                           else{
                               fs.writeFile(dumpDir, 'orders.txt', getAllOrderData(), function(err){
                                   if (err){
                                       response.writeHead(200);
                                       response.write("Dump failed." + JSON.stringify(err));
                                       out.connectionsInfo("Dump failed." + JSON.stringify(err));
                                       response.end();
                                   }
                                   else{
                                       response.writeHead(200);
                                       response.write("Dump success");
                                       out.connectionsInfo("Dump success");
                                       response.end();
                                   }
                               });
                           }
                       });
                   }
               });
           }
        });
    }
    else{
        response.writeHead(200);
        response.write("Dump failed. unknown command");
        out.connectionsInfo('Dump failed. unknown command');
        response.end();
    }
    return false;
};

module.exports = {
    start : function(){
        var out = require('out');
        var http = require("http");
        var server = http.createServer(function(request, response){
            out.connectionsInfo('Dump request: ' + request);
            if(request.method == 'POST'){
                var body = "";
                request.on('data', function (chunk) {
                    body += chunk;
                });
                request.on('end', function () {
                    try {
                        var data = JSON.parse(body);
                        if (data.l && data.p && data.l == 'dump' && data.p == 'dump089' && data.command){
                            handleDump(data.command, response);
                        }
                        else{
                            response.writeHead(403);
                            out.connectionsInfo('Dump access denied: ' + body);
                            response.end();
                        }
                    }
                    catch (exp) {
                        response.writeHead(403);
                        out.connectionsInfo('Dump handle error. Request data: ' + body, exp);
                        response.end();
                    }
                });
            }
            else{
                response.writeHead(403);
                out.connectionsInfo('Dump request is not POST');
                response.end();
            }
        });
        server.listen(4455);
    }
};