var app = angular.module('zebra');

app.controller('ScheduleController', function($rootScope, $scope, $state){
    $scope.selected = false;
    var tree = [
        {
            text: "MENS ACTIVE",
            nodes: [
                {
                    text: "Deadline: 7/30/16",
                    selectable: false
                },
               {
                    text: "Priority: High",
                    selectable: false
               }
            ]
        },
        {
            text: "FRAMES",
            nodes: [
                {
                    text: "Deadline: 7/29/16",
                    selectable: false
                },
               {
                    text: "Priority: Low",
                    selectable: false
               }
            ]
        },
        {
            text: "CARDS AND WRAP",
            nodes: [
                {
                    text: "Deadline: 7/30/16",
                    selectable: false
                },
               {
                    text: "Priority: Low",
                    selectable: false
               }
            ]
        }
    ];
    
    $('#tree').treeview({data: tree});
    $('#tree').treeview('collapseAll', { silent: true });
    
    $scope.continue = function() {
        $state.go("inventory", {floorPad: 54, department: 24})
    }
    
    $('#tree').on('nodeSelected', function(event, data) {
        $scope.selected = true;
        $scope.$apply();
    });
});
