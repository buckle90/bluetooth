var app = angular.module('zebra');

app.controller('SelectController', function($rootScope, $scope, $http, $cookies, $state){
    $scope.selected = false;
    var tree = [
        {
            text: "MENS ACTIVE",
            nodes: [{
                text: "MENS TEAM APPAREL"
            }]
        }
    ];
    
    $('#tree').treeview({data: tree});
    
    $scope.continue = function() {
        $state.go("inventory", {floorPad: 54, department: 24})
    }
    
    $('#tree').on('nodeSelected', function(event, data) {
        $scope.selected = true;
        $scope.$apply();
    });
    
});
