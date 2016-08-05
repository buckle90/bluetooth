var app = angular.module('zebra');
//var updateGPS;

app.controller('CountController', function($rootScope, $scope, $http, $stateParams, $state){
    $scope.showTags = false;
    $scope.showMap = false;
    var latlngs = [];
    var person = null;
    $scope.display = 'info';
    
    updateGPS = function(data) {
        $scope.latlng = [data.lat, data.lng];
        if (person == null) {
            person = L.circle([data.lat, data.lng], 1, {
                color: 'blue',
                fillColor: 'blue',
                fillOpacity: 0.3,
                stroke: false
            }).addTo(map);
        } else {
            person.setLatLng([data.lat, data.lng]);
        }
        $scope.$apply();
    }
    
    $http.post("/api/cycleCounts", {id: $stateParams.id})
    .success(function (data) {
        $scope.cycleCount = data.cycleCount;
        $scope.tags = data.tags;
        $scope.additions = data.additions;
        $scope.missing = data.missing;
        var d = new Date($scope.cycleCount.startTime);
        $scope.cycleCount.date = d.toLocaleString();
        
        angular.forEach($scope.tags, function(tag, key){
            latlngs.push([tag.latitude, tag.longitude]);
            
            var circle = L.circle([tag.latitude, tag.longitude], 1, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.1,
                stroke: false
            }).addTo(map);
        });
        
        var bounds = new L.LatLngBounds(latlngs);
        map.fitBounds(bounds);
        
        var foundTree = [];
        var missingTree = [];
        var foundBrands = [];
        var missingBrands = [];
        
        angular.forEach($scope.tags, function(tag, key){
            if (foundBrands.indexOf(tag.item.BRAND) >= 0) {
                foundTree[foundBrands.indexOf(tag.item.BRAND)].nodes.push({
                    text: tag.item['SKU-DESC-NAME'],
                    tags: [tag.tagID]
                });
            }
            else {
                foundBrands.push(tag.item.BRAND);
                foundTree.push({
                    text: tag.item.BRAND +  " (" + ($scope.cycleCount.targetCount-$scope.cycleCount.count) + "/" + $scope.cycleCount.targetCount + ")",
                    nodes: [{
                        text: tag.item['SKU-DESC-NAME'],
                        tags: [tag.tagID]
                    }],
                    selectable: false
                });
            }
        });
        
        $('#foundTree').treeview({data: foundTree});
        $('#foundTree').treeview('collapseAll', { silent: true });
        
        angular.forEach($scope.missing, function(tag, key){
            if (missingBrands.indexOf(tag.BRAND) >= 0) {
                missingTree[missingBrands.indexOf(tag.BRAND)].nodes.push({
                    text: tag['SKU-DESC-NAME'],
                    tags: [tag.epc]
                });
            }
            else {
                missingBrands.push(tag.BRAND);
                missingTree.push({
                    text: tag.BRAND +  " (" + $scope.cycleCount.count + "/" + $scope.cycleCount.targetCount + ")",
                    nodes: [{
                        text: tag['SKU-DESC-NAME'],
                        tags: [tag.epc]
                    }],
                    selectable: false
                });
            }
        });
        
        $('#missingTree').treeview({data: missingTree});
        $('#missingTree').treeview('collapseAll', { silent: true });
        
        $('#foundTree, #missingTree').on('nodeSelected', function(event, data) {
            $state.go('item', {id: data.tags[0]});
        });
    });
    
    var map = L.map('mapid', {
        dragging: false, 
        touchZoom: false, 
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        zoomControl: false,
        attributionControl: false,
    }).setView([51.505, -0.09], 13);
    
    map._layersMaxZoom = 20; 
    
    // load a tile layer
//    L.tileLayer('http://tiles.mapc.org/basemap/{z}/{x}/{y}.png',
//    {
//      maxZoom: 20
//    }).addTo(map);

    if ($rootScope.latlng) {
        person = L.circle($rootScope.latlng, 1, {
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.3,
            stroke: false
        }).addTo(map);
    }
    
    $scope.switch = function(name) {
        $(".displayItem").hide();
        $("."+name).show();
    }
});
