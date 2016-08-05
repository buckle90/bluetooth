var app = angular.module('zebra', ['ui.router', 'ngCookies']);

app.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('inventory', {
            url: '/inventory/:floorPad/:department/:parent',
            templateUrl: '/templates/inventory.html',
            controller: 'InventoryController',
        })
        .state('inventory.item', {
            url: '/inventoryItem/:id',
            templateUrl: '/templates/item.html',
            controller: 'ItemController'
        })
        .state('select', {
            url: '/select',
            templateUrl: '/templates/select.html',
            controller: 'SelectController'
        })
        .state('task', {
            url: '/task',
            templateUrl: '/templates/task.html',
            controller: 'TaskController'
        })
        .state('schedule', {
            url: '/schedule',
            templateUrl: '/templates/schedule.html',
            controller: 'ScheduleController'
        })
        .state('connect', {
            url: '/connect',
            templateUrl: '/templates/connect.html',
            controller: 'ConnectController'
        })
        .state('locate', {
            url: '/locate/:task',
            templateUrl: '/templates/locate.html',
            controller: 'LocateController'
        })
        .state('locateTask', {
            url: '/locateTask',
            templateUrl: '/templates/locateTask.html',
            controller: 'LocateTaskController'
        })
        .state('bopus', {
            url: '/bopus',
            templateUrl: '/templates/bopus.html',
            controller: 'BopusController'
        })
        .state('search', {
            url: '/search',
            templateUrl: '/templates/search.html',
            controller: 'SearchController'
        })
        .state('settings', {
            url: '/settings',
            templateUrl: '/templates/settings.html',
            controller: 'SettingsController'
        })
        .state('history', {
            url: '/history',
            templateUrl: '/templates/history.html',
            controller: 'HistoryController'
        })
        .state('count', {
            url: '/count/:id',
            templateUrl: '/templates/count.html',
            controller: 'CountController'
        })
        .state('item', {
            url: '/item/:id',
            templateUrl: '/templates/item.html',
            controller: 'ItemController'
        })
        .state('access', {
            url: '/access',
            templateUrl: '/templates/access.html',
            controller: 'AccessController'
        })
        .state('login', {
            url: '/login',
            templateUrl: '/templates/login.html',
            controller: 'LoginController'
        });

  $urlRouterProvider.otherwise('/history');
});

app.run(function($rootScope, $cookies, $state) {
    var token = $cookies.get('deviceName');
    $rootScope.user = $cookies.get('user');
    
    if (token) {
        $rootScope.connectedReader = device.getConnectedReader();
        $rootScope.$apply();
    }
})

var updateGPS;
app.controller('MainCtrl', function($rootScope, $scope, $location, $state, $cookies){
    
    var previousUrl = $location.url(); 
    $scope.active = 'inventory';
    
    updateGPS = function(data) {
        $rootScope.latlng = [data.lat, data.lng];
        $rootScope.$apply();
    }
    
    $scope.closeMenu = function() {
       $(".navbar-toggle").trigger("click");
    }
    
    $scope.switch = function(state) {
        $state.go(state);
        $scope.active = state;
        $scope.closeMenu();
    }
    
    $scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
        if (previousUrl === newUrl && $(".navmenu").hasClass("canvas-slid")) {
            event.preventDefault();
            $(".navbar-toggle").trigger("click");
        } else {
            previousUrl = oldUrl;
        }
    });
    
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if ($cookies.get('user') == null) {
            $state.go("login");
        }
        
        $scope.active = toState.name;
        if (toState.name == "count") {
            $scope.active = "history";
        }
        else if (toState.name == "access") {
            $scope.active = "Read/Write";
        }
        else if (toState.name == "locateTask" || toState.name == "bopus") {
            $scope.active = "locate";
        }
        else if (toState.name == "select" || toState.name == "task" || toState.name == "schedule" || toState.name == "inventory.item") {
            $scope.active = "inventory";
        }
        $rootScope.connectedReader = device.getConnectedReader();
    })
});

