var app = angular.module('zebra');

app.controller('TaskController', function($rootScope, $scope, $state){
    $scope.goTo = function(state) {
        $state.go(state);
    }
});
