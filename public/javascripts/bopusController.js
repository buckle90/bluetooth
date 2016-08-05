var app = angular.module('zebra');

app.controller('BopusController', function($rootScope, $scope, $state){    
    var tree = [
        {
            text: "Order 1",
            nodes: [{
                text: "Shirt",
                selectable: false
            },
            {
                text: "Pants",
                selectable: false
            },
            {
                text: "Shoes",
                selectable: false
            }]
        },
        {
            text: "Order 2",
            nodes: [{
                text: "Shirt",
                selectable: false
            },
            {
                text: "Pants",
                selectable: false
            },
            {
                text: "Shoes",
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
    
    
});
