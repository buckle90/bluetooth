var app = angular.module('zebra');

app.controller('HistoryController', function($scope, $http, $state){
    
    $http.get("/api/cycleCounts")
    .success(function (data) {
        $scope.cycleCounts = data.counts;
    })
    
    $scope.open = function(id) {
        $state.go("count", {id: id});
    }

});
