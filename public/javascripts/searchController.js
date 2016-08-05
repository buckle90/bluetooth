var app = angular.module('zebra');

app.controller('SearchController', function($rootScope, $scope, $http, $cookies, $state){
    $scope.query = "";
    $scope.selected = false;
    $scope.search = false;
    
    var tree = [
        {
            text: "SAFETY BLI A/LS F-ZI (M)",
            nodes: [{
                text: "MENS TEAM APPAREL",
                selectable: false
            },
            {
                text: "NFL",
                selectable: false
            }]
        },
        {
            text: "SAFETY BLI A/LS F-ZI (L)",
            nodes: [{
                text: "MENS TEAM APPAREL",
                selectable: false
            },
            {
                text: "NFL",
                selectable: false
            }]
        },
        {
            text: "MLB SS Prac T 1.5 (S)",
            nodes: [{
                text: "MENS TEAM APPAREL",
                selectable: false
            },
            {
                text: "MLB",
                selectable: false
            }]
        },
        {
            text: "MLB SS Prac T 1.5 (XL)",
            nodes: [{
                text: "MENS TEAM APPAREL",
                selectable: false
            },
            {
                text: "MLB",
                selectable: false
            }]
        }
    ];
    
    $('#tree').treeview({data: tree});
    $('#tree').treeview('collapseAll', { silent: true });
    
    $('#tree').on('nodeSelected', function(event, data) {
        $scope.selected = true;
        $scope.$apply();
    });
    
    $scope.select = function() {
        $state.go("locate");
    }
});
