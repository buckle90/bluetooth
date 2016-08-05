var app = angular.module('zebra');
var refreshReaders;

app.controller('ConnectController', function($scope, $cookies, $http){
    $scope.readers = [];
    $scope.connectedReader = "";
    $scope.message = "";
    $scope.loading = false;
    
    device.setTask("connect");
    
    refreshReaders = function() {
        $scope.refresh();
        $scope.$apply();
    }
    
    $scope.refresh = function() {
        $scope.loading = false;
        $scope.message = "";
        var json = JSON.parse(device.getReaders());
        $scope.readers = JSON.parse(json.readers);
        $scope.connectedReader = device.getConnectedReader();
        
        angular.forEach($scope.readers, function(reader, key){
            reader.connected = false;
            if (reader.name == $scope.connectedReader) {
                reader.connected = true;
            }
        });
        
    }
    
    $scope.refresh();
    
    $scope.connect = function(name) {
        if ($scope.connectedReader == "" || !$scope.connectedReader) {
            $scope.loading = true;
            device.connect(name);
            $scope.message = "";
        }
        else if ($scope.connectedReader == name) {
            $scope.loading = true;
            device.disconnect();
            //$scope.refresh();
            $scope.message = "";
        }
        else {
            $scope.message = "A reader is already connected."
        }
    }
});
