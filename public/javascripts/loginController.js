var app = angular.module('zebra');

app.controller('LoginController', function($rootScope, $scope, $state, $cookies){
    $scope.login = function(user) {
        $rootScope.user = user;
        $cookies.put("user", user);
        $state.go("history");
    }
});
