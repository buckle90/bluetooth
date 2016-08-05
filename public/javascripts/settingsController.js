var app = angular.module('zebra');

app.controller('SettingsController', function($scope, $http){
//    $scope.beeper = false;
    $scope.beeper = device.getBeeper();

    
    
    $scope.setBeeper = function() {
        device.setBeeper($scope.beeper);
    }
});
