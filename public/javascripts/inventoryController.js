var app = angular.module('zebra');
var updateInventory;


app.controller('InventoryController', function($rootScope, $scope, $state, $cookies, $http, $stateParams, $location){
    $scope.inventoryItems = [];
    $scope.inventoryActive = false;
    $scope.inventoryComplete = false;
    $scope.uniqueItems = 0;
    $scope.targetAmount;
    $scope.message = "";
    $scope.percentage = 0;
    $scope.parent = $stateParams.parent == '' ? null : parseInt($stateParams.parent);
    $scope.moreInfo = false;
    $scope.display = "found";
    $scope.allEpcs = [];
    $scope.foundItems = [];
    $scope.hidden = false;
    var foundTree = [];
    var missingTree = [];
    var foundBrands = [];
    var missingBrands = [];
    var allItems = [];
    var previousUrl = $location.url(); 
    
    $scope.dept = $stateParams.department;
    $scope.floorPad = $stateParams.floorPad;
    
    var items = [];
    var cycleCount = {
        parent: null,
        floorPad: null,
        dept: null,
        startTime: null,
        endTime: null,
        targetCount: null,
        count: null,
        user: null
    };
    
    device.setTask("inventory");
    
    updateInventory = function(data) {
        var item = JSON.parse(data.item)
        $scope.inventoryItems.push(item);
        $scope.foundItems.push(item.tagID);
        $scope.uniqueItems = data.unique_tags;
        $scope.percentage = (($scope.uniqueItems/$scope.targetAmount)*100).toFixed(0);
        
        if ($scope.moreInfo) {
            $scope.showInfo(false);
        }
        
        $scope.$apply();
    }
    
    $scope.startInventory = function(floorPad, dept) {
        var list = []
        $scope.message = "";
        
        cycleCount.floorPad = floorPad;
        cycleCount.dept = dept;
        cycleCount.parent = $scope.parent;
        cycleCount.user = $scope.user;
        
        $http.post("/api/items", { floorPadId: floorPad, deptId: dept, parent: cycleCount.parent })
        .success(function (data) {
            if (data.list.length != 0) {
                var parent = cycleCount.parent ? cycleCount.parent.toString() : null;
                var items = JSON.parse(device.startInventory(JSON.stringify(data), parent));
                
                angular.forEach(items, function(item, key){
                    $scope.foundItems.push(item.tagID);
                });
                
                $scope.allEpcs = data.list;
                $scope.uniqueItems = items.length;
                $scope.targetAmount = data.list.length;  
                cycleCount.targetCount = data.list.length;
                $scope.percentage = (($scope.uniqueItems/$scope.targetAmount)*100).toFixed(0);
                $scope.inventoryActive = true;
                $scope.inventoryComplete = false;
            }
            else {
                $scope.message = "No items were found with these parameters.";
            }
        })
    }
    
    $scope.stopInventory = function() {
        $scope.inventoryActive = false;
        $scope.inventoryComplete = true;
        var data = JSON.parse(device.stopInventory());
        cycleCount.startTime = data.startTime;
        cycleCount.endTime = data.endTime;
        cycleCount.count = $scope.uniqueItems;
        items = JSON.parse(data.items)
        $scope.finalCount = cycleCount.count;
    }
    
    $scope.sendInventory = function() {
        $http.post("/api/save", { cycleCount: cycleCount, items: items })
        .success(function (data) {
            if (data.status == "Success") {
                $scope.resetInventory();
                $scope.message = "Data saved successfully.";
                $state.go('count', { id: cycleCount.parent ? cycleCount.parent : cycleCount.startTime });
            }
            else {
                $scope.message = "Could not save data.";
            }
        })
    }
    
    $scope.resetInventory = function() {
        $scope.message = "";
        $scope.percentage = 0;
        $scope.inventoryComplete = false;
        $scope.inventoryItems = [];
        device.resetInventory();
        $scope.uniqueItems = 0;
        var cycleCount = {
            parent: null,
            floorPad: null,
            dept: null,
            startTime: null,
            endTime: null,
            targetCount: null,
            count: null,
            user: null
        };
        items = [];
    }
    
    $scope.showInfo = function(clicked) {
        if (clicked) {
            $scope.moreInfo = !$scope.moreInfo;
        }

        if ($scope.moreInfo) {
            $http.post("/api/epcData", { foundEpcs: $scope.foundItems, allEpcs: $scope.allEpcs })
            .success(function (data) {
                foundTree = [];
                missingTree = [];
                foundBrands = [];
                missingBrands = [];
                allItems = data.tags.concat(data.missing);
                $scope.brandsMap = {};
                var i = 0;
                
                angular.forEach(allItems, function(tag, key){
                    if (!(tag.BRAND in $scope.brandsMap)) {
                        $scope.brandsMap[tag.BRAND] = {
                            total: 1,
                            found: 0,
                            missing: 1
                        }
                        i++;
                    }
                    else {
                        $scope.brandsMap[tag.BRAND].total++;
                        $scope.brandsMap[tag.BRAND].missing++;
                    }
                });

                angular.forEach(data.tags, function(tag, key){
                    $scope.brandsMap[tag.BRAND].found++;
                    $scope.brandsMap[tag.BRAND].missing--;
                });

                angular.forEach(data.tags, function(tag, key){
                    if (foundBrands.indexOf(tag.BRAND) >= 0) {
                        foundTree[foundBrands.indexOf(tag.BRAND)].nodes.push({
                            text: tag['SKU-DESC-NAME'],
                            tags: [tag.epcData.epcID]
                        });
                    }
                    else {
                        foundBrands.push(tag.BRAND);
                        foundTree.push({
                            text: tag.BRAND + " (" + $scope.brandsMap[tag.BRAND].found + "/" + $scope.brandsMap[tag.BRAND].total + ")",
                            nodes: [{
                                text: tag['SKU-DESC-NAME'],
                                tags: [tag.epcData.epcID]
                            }],
                            selectable: false
                        });
                    }
                });

                $('#foundTree').treeview({data: foundTree});
                $('#foundTree').treeview('collapseAll', { silent: true });

                angular.forEach(data.missing, function(tag, key){
                    if (missingBrands.indexOf(tag.BRAND) >= 0) {
                        missingTree[missingBrands.indexOf(tag.BRAND)].nodes.push({
                            text: tag['SKU-DESC-NAME'],
                            tags: [tag.epcData.epcID]
                        });
                    }
                    else {
                        missingBrands.push(tag.BRAND);
                        missingTree.push({
                            text: tag.BRAND + " (" + $scope.brandsMap[tag.BRAND].missing + "/" + $scope.brandsMap[tag.BRAND].total + ")",
                            nodes: [{
                                text: tag['SKU-DESC-NAME'],
                                tags: [tag.epcData.epcID]
                            }],
                            selectable: false
                        });
                    }
                });

                $('#missingTree').treeview({data: missingTree});
                $('#missingTree').treeview('collapseAll', { silent: true });
                
                $('#foundTree, #missingTree').on('nodeSelected', function(event, data) {
                    $state.go('inventory.item', {id: data.tags[0]});
                    $(".hideable").hide();
                    $scope.hidden = true;
                });
            });
        }
    }
    
    $scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
        if (previousUrl === newUrl) {
            $scope.hidden = false;
            $(".hideable").show();
        } else {
            previousUrl = oldUrl;
        }
    });
});