/**
 * Created by a.amrastanov on 19.07.2015.
 */

function handleUnusedIssues(){
    var issueHandler = require('issueHandler');
    var clientHandler = require('userHandler').clientHandler;
    for (var issueId in issueHandler.issuesById){
        var issue = issueHandler.getIssueById(issueId);
        var client = clientHandler.getUserById(issue.data.clientId);
        if (!client || client.issueId != issueId){
            issue.removeUsers();
            require('db').issueActionDb.insertNew(issue.data.id, require('db').ISSUE_ACTIONS.GARBAGE_DELETE);
            require('issueHandler').removeIssue(issue);
        }
    }
};

module.exports = {
  start : function() {
      setInterval(function () {
        handleUnusedIssues();
      }, 90000);
  }
};