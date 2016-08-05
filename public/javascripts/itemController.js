var app = angular.module('zebra');

app.controller('ItemController', function($rootScope, $scope, $state, $http, $stateParams){
    var latlngs = [];
    var person = null;
    
    $http.post("/api/item", {id: $stateParams.id})
    .success(function (data) {
        $scope.item = data.item;
        var d = new Date($scope.item.epcData.dateFirstSeen);
        $scope.item.epcData.dateFirstSeen = d.toLocaleString();
        d = new Date($scope.item.epcData.dateLastSeen);
        $scope.item.epcData.dateLastSeen = d.toLocaleString();
        
        var circle = L.circle([$scope.item.epcData.latitudeLastSeen, $scope.item.epcData.longitudeLastSeen], 1, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 1,
            stroke: false
        }).addTo(map);
        
        map.setView([$scope.item.epcData.latitudeLastSeen, $scope.item.epcData.longitudeLastSeen], 18);
        
        var bounds = new L.LatLngBounds([$rootScope.latlng, [$scope.item.epcData.latitudeLastSeen, $scope.item.epcData.longitudeLastSeen]]);
        map.fitBounds(bounds);
    });
    
    updateGPS = function(data) {
        $scope.latlng = [data.lat, data.lng];
        if (person == null) {
            person = L.circle([data.lat, data.lng], 1, {
                color: 'blue',
                fillColor: 'blue',
                fillOpacity: .8,
                stroke: false
            }).addTo(map);
        } else {
            person.setLatLng([data.lat, data.lng]);
        }
        $scope.$apply();
    }
    
    var map = L.map('itemMap', {
        dragging: false, 
        touchZoom: false, 
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        zoomControl: false,
        attributionControl: false,
    }).setView([51.505, -0.09], 13);
    
    map._layersMaxZoom = 20; 

    if ($rootScope.latlng) {
        person = L.circle($rootScope.latlng, 1, {
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.3,
            stroke: false
        }).addTo(map);
    }
    
});
