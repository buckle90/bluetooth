var app = angular.module('zebra');
var updateReadWriteData;

app.controller('AccessController', function($scope, $http, $state){
    // Temp values
    $scope.id = "3314186ADC280AC000002712";
    
    device.setTask("access");
    
    updateReadWriteData = function(data) {
        console.log(data)
        if (data.task == "update_read_data") {
            $scope.data = data.item;
        }
        if (data.task == "update_write_data") {
            if (data.status == "Success") {
                $scope.message = "Write Successful";
            }
        }
        $scope.$apply();
    }
    
    $scope.read = function(tagID) {
        device.readTag(tagID);
        $scope.message = "";
        $scope.data = "";
    }
    
    $scope.write = function(tagID, data) {
        device.writeTag(tagID, data);
        $scope.message = "";
    }

});
