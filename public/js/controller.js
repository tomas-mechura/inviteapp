var emailREGEX = "[a-zA-Z0-9.!#$%&*+/=?^_{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*";

// decided to rather check by one regex rather than splitting string to separate email adresses and check that, as this will be done again on backend,
// and this solution will do the validation on the fly, result shown by colors of the written text
// Planned to popup info messages in their own div element and remove it after specified time...
var multipleEmailREGEX = new RegExp( "^\\s*" + emailREGEX + "(?:\\s*,\\s*" + emailREGEX + ")*\\s*$");

angular.module('inviteApp', [])
    .controller('inviteCtrl', function($scope,$http,$location) {
        $scope.data = {};
        $scope.pattern =  multipleEmailREGEX
        baseUrl = $location.$$absUrl;
        // get the available roles
        $http.get(baseUrl + "inviteapi/roles").then(function (result) {
            $scope.data.options = result.data;
            // default to first
            $scope.frole = Object.keys($scope.data.options)[0];
        }, function (error) {
            $scope.msgs = error.status + ": " + error.statusText + " - " + error.data;
        });
        $scope.sendInviteForm = function () {
            if ($scope.inviteForm.$invalid) { 
                $scope.msgs = "Form is invalid, please check!"; 
            } else {
                $http.post('/inviteapi/invites',  { 'emails' : $scope.femails, 'role' : $scope.frole }).then(function (result) {
                    $scope.msgs = 'Emails succesfully sent';
                    $scope.femails = "";    
                }, function (error) {
                    $scope.msgs = error.status + ": " + error.statusText + " - " + error.data;
                });
            }
        // for cleaning up ng-dirty and other flags, 
        $scope.inviteForm.$setPristine();
        $scope.inviteForm.$setUntouched();
        };
    });