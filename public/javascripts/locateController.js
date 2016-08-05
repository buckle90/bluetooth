var app = angular.module('zebra');
var updateLocate;

app.controller('LocateController', function($scope, $http, $stateParams){
    $scope.index = 0;
    $scope.tags = {}
    $scope.task = $stateParams.task;
    $scope.foundAll = false;
    var maxRSSI = -30;
    var max = 40;
    
    console.log($stateParams);
    
    // Temp values
    $scope.tags[$scope.index] = {
        id: "3314186ADC280AC000002712",
        proximity: 0
    };
    
    $scope.index = 1;
    
    $scope.tags[$scope.index] = {
        id: "33141877A80B64C000002713",
        proximity: 0
    };
    
    var items = [
        {
            dept: "MENS TEAM APPAREL",
            item: "Shirt"
        },
        {
            dept: "MENS TEAM APPAREL",
            item: "Pants"
        },
        {
            dept: "FOOTWEAR",
            item: "Shoes"
        }
    ];
    $scope.item = items[0]
    var index = 0;
    
    device.setTask("locate");
    
    device.startLocate(JSON.stringify($scope.tags));
    $scope.locating = true;
    
    updateLocate = function(data) {
        if (data.task == "update_locate" && $scope.locating) {
            var tagID = data.tagID;
            angular.forEach($scope.tags, function(tag, key){
                 if (tag.id == tagID) {
                    tag.proximity = (((max - (maxRSSI - data.proximity))/max) * 100).toFixed(0);
                }
            });
        }
        $scope.$apply();
    }
    
    $scope.startLocate = function() {
        var ready = true;
        for (tag in $scope.tags) {
           if (tag.id == '') {
               ready = false;
           }
        }
        
        if (ready) {
            device.startLocate(JSON.stringify($scope.tags));
            $scope.locating = true;
        }
    }
    
    $scope.stopLocate = function() {
        device.stopLocate();
        $scope.locating = false;
        angular.forEach($scope.tags, function(tag, key){
            tag.proximity = 0;
        });
    }
    
    $scope.addTag = function() {
        $scope.index++; 
        $scope.tags[$scope.index] = {
            id: '', 
            proximity: 0
        }
    }
    
    $scope.found = function() {
        index++;
        if (index >= items.length) {
            $scope.foundAll = true;
            device.stopLocate();
        }
        else {
            $scope.item = items[index];
        }
    }
});
