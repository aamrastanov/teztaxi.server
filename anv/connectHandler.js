/**
 * Created by a.amrastanov on 28.06.2014.
 */
var crypto = require('crypto'),
    algorithm = 'AES-128-ECB',
    key = 'efhgyj8_grt6s;@b';

function encrypt(text){
    var cipher = crypto.createCipheriv(algorithm, key, new Buffer(''));
    var chunks = [];
    chunks.push(cipher.update(
        new Buffer(text),
        'buffer', 'base64'));
    chunks.push(cipher.final('base64'));
    return chunks.join('');
}
function decrypt(text){
    var cipher = crypto.createDecipheriv(algorithm, key, new Buffer(''));
    var chunks = [];
    chunks.push(cipher.update(
        new Buffer(text, 'base64'),
        'buffer', 'utf8'));
    chunks.push(cipher.final('utf8'));
    return chunks.join('');
}

var out = require('out');
function SockAppContext(userHandler, userDB, actionHandler){
    this.userHandler = userHandler;
    this.userDB = userDB;
    this.actionHandler = actionHandler;
}

var ConnectHandler;
ConnectHandler = {
    handleInput: function(sock, sockAppContext, message){
        
        var parameterMap;
        try {
            parameterMap = JSON.parse(message);
        }
        catch (exp) {
            try {
                parameterMap = JSON.parse(decrypt(message));
            }
            catch (exp){
                out.error("Input parsing error", exp, message, out.getSockInfo(sock));
                sock.destroy();
                return;
            }
        }
        out.action("receive", out.getSockInfo(sock), JSON.stringify(parameterMap));
        if (parameterMap.token === undefined) {
            out.action("Message with undefined token", parameterMap, out.getSockInfo(sock));
            sock.destroy();
            return;
        }
        var userHandler = sockAppContext.userHandler;
        var user = userHandler.getUserByToken(parameterMap.token);
        if (user) {
            if (user.sock !== sock){
                user.reconnectCount++;
                var oldSock = user.sock;
                delete oldSock.userId;
                oldSock.destroy();
                user.sock = sock;
                sock.userId = user.data.id;
            }
            var actionResult = sockAppContext.actionHandler.doAction(parameterMap);
            if (actionResult) {
                sock.send(actionResult);
            }
        }
        else {
            var userDB = sockAppContext.userDB;
            userDB.getByToken(parameterMap.token, function (err, userData) {
                if (err){
                    sock.send(require('contextHandler').NewErrorMessage(parameterMap.action, err));
                    out.error('get user by token error (, table = ' + userDB.getTableName() + 'token = ' + parameterMap.token + '), err = ' + err);
                }
                else{
                    try {
                        if (userData.isInBlackList){
                            var errorMessage = require('contextHandler').NewErrorMessage(parameterMap.action, require('errorCodes').is_in_blacklist);
                            out.action(errorMessage);
                            sock.send(errorMessage);
                            sock.destroy();
                        }
                        else{
                            userHandler.addUser(userData, sock);
                            var actionResult = sockAppContext.actionHandler.doAction(parameterMap);
                            if (actionResult) {
                                sock.send(actionResult);
                            }
                        }
                    }
                    catch (exp) {
                        out.error("Add user error", exp.stack, " userData: ", userData);
                        sock.send(require('contextHandler').NewErrorMessage(parameterMap.action, require('errorCodes').inner_server_error));
                    }
                }
            });
        }
    },
    initSocket: function (sock, sockAppContext) {
        sock.unhandledMessage = "";
        sock.send = function(message){
            sock.write(message + "-}{-");
        };
        sock.setEncoding('utf8');
        sock.setTimeout(15000, function(){
            out.connectionsInfo('Sock timeout', out.getSockInfo(sock));
            sock.destroy();
        });
        sock.on('data', function (data) {
            if (!sock.startData){
                sock.startData = 1;
                out.info("start data", out.getSockInfo(sock), data);
            }
            sock.write('~');
            if (sock.waitPing) {
                delete sock.waitPing;
            }
            data = data.replace(/~+/g, "");
            if (data){
                data = sock.unhandledMessage + data;
                var inputs = data.split('-}{-');
                var inputsSize = inputs.length;
                var realMessage = "";
                for(var index = 0; index < inputsSize; index++){
                    var input = inputs[index];
                    if (realMessage){
                        ConnectHandler.handleInput(sock, sockAppContext, realMessage);
                    }
                    realMessage = input;
                }
                sock.unhandledMessage = realMessage;
            };
        });
        sock.on('error', function (err) {
            out.connectionsInfo("Socket error", err, out.getSockInfo(sock));
        });
        sock.on('end', function () {
            out.connectionsInfo("Socket other end send finish command", out.getSockInfo(sock));
        });
    },
    initClientSocket: function (sock) {
        var sockAppContext = new SockAppContext(
            require('userHandler').clientHandler,
            require('db').clientDB,
            require('actionHandler').clientActionHandler);
        this.initSocket(sock, sockAppContext);

        sock.on('close', function (had_error) {
            out.connectionsInfo('Client socket is closed with had_error='+had_error, out.getSockInfo(sock));
            out.action('Client socket is closed with had_error='+had_error, out.getSockInfo(sock));
            if (sock.userId) {
                var clientHandler = require('userHandler').clientHandler;
                var client = clientHandler.getUserById(sock.userId);
                if (client === undefined) {
                    return;
                }
                var issue = client.getIssue();
                if (issue) {
                    var actionHandler = require('actionHandler');
                    actionHandler.serverActionHandler.doAction({
                        action: actionHandler.serverActionsValues.sendIssueRemoveToTaksists,
                        issue: issue
                    });
                    issue.removeUsers();
                    require('db').issueActionDb.insertNew(issue.data.id, require('db').ISSUE_ACTIONS.DISCONNECT_CANCEL);
                    require('issueHandler').removeIssue(issue);
                }
                clientHandler.removeUser(client);
            }
        });
    },
    initTaksistSocket: function (sock) {
        var sockAppContext = new SockAppContext(
            require('userHandler').taksistHandler,
            require('db').taksistDB,
            require('actionHandler').taksistActionHandler);
        this.initSocket(sock, sockAppContext);
        sock.on('close', function (had_error) {
            out.connectionsInfo('Taksist socket is closed with had_error='+had_error, out.getSockInfo(sock));
            out.action('Taksist (' + sock.userId + ') socket is closed had_error='+had_error, out.getSockInfo(sock));
            if (sock.userId !== undefined) {
                var userHandler = require('userHandler');
                var taksistHandler = userHandler.taksistHandler;
                var taksist = taksistHandler.getUserById(sock.userId);
                if (taksist === undefined) {
                    return;
                }
                var issues = taksist.getAllIssues();
                var clients = [];
                for (var index = 0; index < issues.length; index++){
                    var issue = issues[index];
                    issue.removeTaksist(taksist);
                    clients.push(issue.getClient());
                }
                var taksistShowRequestedUsers = userHandler.clientHandler.getTaksistsShowRequestedUsers();
                clients = clients.concat(taksistShowRequestedUsers);
                var actionHandler = require('actionHandler');
                actionHandler.serverActionHandler.doAction({action: actionHandler.serverActionsValues.sendTaksistRemoveToClient,
                    taksist: taksist,
                    clients: clients
                });
                var order = taksist.getOrder();
                if (order){
                    if (taksist.data.state == require('userHandler').WORK_STATE.TRIP_AGREEMENT){
                        actionHandler.serverActionHandler.doAction({
                            action:actionHandler.serverActionsValues.sendOrderRefuseToClient,
                            order: order,
                            reason: actionHandler.serverActionConstants.NOT_AVAILABLE
                        });
                        require('db').orderActionDb.insertNew(order.data.id, require('db').ORDER_ACTIONS.TAKSIST_REFUSE, 'disconnect');
                        require('orderHandler').removeOrder(order);
                    }
                    else{
                        var client = order.getClient();
                        if (client && client.data.state == require('userHandler').WORK_STATE.BEFORE_TRIP){
                            actionHandler.serverActionHandler.doAction({
                                action: actionHandler.serverActionsValues.sendOrderedTaksistOfflineToClient,
                                client: client
                            });
                        }
                    }
                }
                taksistHandler.removeUser(taksist);
            }
        });
    }
};
module.exports = ConnectHandler;
