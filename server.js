var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var http = require("http");
var mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var mongodb = require('mongodb');
var assert = require('assert');
var async = require('async');

var MongoClient = mongodb.MongoClient;
//Creating Router() object
var router = express.Router();
// Set base directory to public
app.use(express.static(__dirname + "/public"));
// Expose node_modules through /scripts path
app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.use('/csv', express.static(__dirname + '/rfid/'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(cookieParser());

var mongoUrl = 'mongodb://localhost:27017/rfid';
var db;
var tags = [];

MongoClient.connect(mongoUrl, function (err, d) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error: ', err);
    } else {
        db = d
    }
});

/*
*   Return list of EPCs in the specified department and floorpad
*   params: floorPadId, deptId
*/
app.post('/api/items', function(req, res) {
    var epcList = [];
    
    findItems(db, parseInt(req.body.floorPadId), parseInt(req.body.deptId), function(list) {
        if (req.body.parent != null) {
            getCycleCountEpcs(db, parseInt(req.body.parent), function(epcList) {
                return res.json({ list: list, epcList: epcList });
            });
        } else {
            return res.json({ list: list, epcList: epcList });
        }
    });
});

/*
*   Return single item information
*   params: epc
*/
app.post('/api/item', function(req, res) {
    findItem(db, req.body.id, function(item) {
        return res.json({ item: item });
    })
});

app.post('/api/save', function(req, res) {
    var cycleCount = req.body.cycleCount;
    var items = req.body.items;
    if (items.length > 0) {
//      insert cycle count and epc history
        insert(db, cycleCount, items, function() {
//          update epc collection with most recent time and location
            updateEpcs(db, items, function() {
                return res.json({ status: "Success" });
            });
        });
    }
    else {
        return res.json({ status: "Success" });
    }
});

// Gets all parent cycle counts
app.get('/api/cycleCounts', function(req, res) {
    getCycleCountParents(db, function(list) {
        return res.json({ counts: list });
    });
});

// Gets data of single cycle count
app.post('/api/cycleCounts', function(req, res) {
    tags = [];
    getCycleCount(db, parseInt(req.body.id), function(cycleCount, tags, additions, missing) {
        return res.json({ cycleCount: cycleCount, tags: tags, additions: additions, missing: missing });
    });
});

// Returns epc info from a list of epcs
app.post('/api/epcData', function(req, res) {
    epcData(db, req.body.foundEpcs, req.body.allEpcs, function(tags, missing) {
        return res.json({ tags: tags, missing: missing });
    })
});

var epcData = function(db, foundEpcs, allEpcs, callback) {
    var foundItems = [];
    var missingItems = [];
    var asyncTasks = [];
    var i = 1;
    
    asyncTasks.push(function(cb) {
        allEpcs.forEach(function(tag) {
            if (foundEpcs.indexOf(tag) == -1) {
                findItem(db, tag, function(item) {
                    missingItems.push(item);
                    if (i == allEpcs.length) {
                        cb();
                    }
                    else {
                        i++;
                    }
                });
            }
            else {
                findItem(db, tag, function(item) {
                    foundItems.push(item);
                    if (i == allEpcs.length) {
                        cb();
                    }
                    else {
                        i++;
                    }
                })
            }
        });
    });
    
    async.parallel(asyncTasks, function(){
        callback(foundItems, missingItems);
    });
}

var findItem = function(db, epc, callback) {
    db.collection('epc_upc').find({'epc': epc}).toArray(function(err, map) {
        db.collection('items').findOne({'UPC-NBR': map[0].upc}, function(err, item) {
            db.collection('epc').findOne({'epcID': map[0].epc}, function(err, tag) {
                item.epcData = tag;
                callback(item);
            });
        });
    });
}

// Gather data for each epc tag -- should probably make this less hacky
var getCycleCountData = function(db, id, cycleCount, callback) {
    findItems(db, parseInt(cycleCount.floorpadID), parseInt(cycleCount.deptID), function(epcs) {
        db.collection('cycleCountTransactions').find({ parent: id }).toArray(function(err, children) {
            db.collection('epcHistory').find({ cycleCountID: id }).count()
            .then(function(numResults) {
                var cursor = db.collection('epcHistory').find({ cycleCountID: id });
                // Array to hold async tasks
                var asyncTasks = [];
                var i = 1;
                asyncTasks.push(function(cb) {
                    cursor.each(function(err, doc) {
                        assert.equal(err, null);
                        if (doc != null) {
                            db.collection('epc_upc').findOne({ epc: doc.tagID })
                            .then(function(map) {
                                doc.upc = map.upc; 
                                db.collection('items').findOne({ 'UPC-NBR': doc.upc })
                                .then(function(item) {
                                    doc.item = item;
                                    tags.push(doc);
                                    if (i == numResults) cb();
                                    else i++;
                                })
                            })
                        }
                    });  
                });

                async.parallel(asyncTasks, function(){
                    var missing = [];
                    var misingUPCs = [];

                    tags.forEach(function(tag) {
                        epcs.splice(epcs.indexOf(tag.tagID), 1);
                    });
                    
                    db.collection('epc_upc').find({'epc': { $in: epcs }}).toArray(function(err, map) {
                        var upcs = [];
                        for (var i = 0; i < map.length; i++) {
                            upcs.push(parseInt(map[i].upc));   
                        }
                        
                        db.collection('items').find({ 'UPC-NBR': { $in: upcs }, 'FLR-PAD-ID': parseInt(cycleCount.floorpadID), 'DEPT-NBR': parseInt(cycleCount.deptID) }).toArray(function(err, docs) {
                            docs.forEach(function(doc) {
                                if (misingUPCs.indexOf(doc['UPC-NBR']) == -1) {
                                    
                                    var hit = false;
                                    var i = 0;
                                    map.forEach(function(tag) {
                                        if (tag.upc == doc['UPC-NBR'] && !hit) {
                                            doc.epc = tag.epc;
                                            map.splice(i, 1);
                                            hit = true;
                                        }
                                        i++;
                                    });
                                    
                                    missing.push(doc);
                                    misingUPCs.push(doc['UPC-NBR']);
                                }
                            });
                            callback(cycleCount, tags, children, missing);
                        });
                    });
                });
            })
        });
    })
};

var getCycleCount = function(db, id, callback) {
    var cycleCount;
    var cursor = db.collection('cycleCountTransactions').find({ _id: id });
    cursor.each(function(err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            cycleCount = doc;
        } else {
            getCycleCountData(db, id, cycleCount, callback);
        }
    });  
};

var getCycleCountParents = function(db, callback) {
    list = []
    db.collection('cycleCountTransactions').find({parent: null}).sort({'startTime': -1}).toArray(function(err, parents) {
        db.collection('cycleCountTransactions').find({parent: {$ne: null}}).toArray(function(err, children) {
            parents.forEach(function(parent) {
                var d = new Date(parent.startTime);
                parent.date = d.toLocaleString();
                list.push(parent._id);
            });
            
            children.forEach(function(child) {
                if (parents[list.indexOf(child.parent)].count < child.count) {
                    parents[list.indexOf(child.parent)].count = child.count;
                }
            });
            
            callback(parents);
        });
    });
};

var updateEpcs = function(db, items, callback) {
    items.forEach(function(item) {
        db.collection('epc').find({ epcID: item.tagID }).count().then(function(count) {
            // Update existing item
            if(count > 0) {
                db.collection('epc').update({ epcID: item.tagID }, { $set: {
                        dateLastSeen: item.dateSeen, 
                        latitudeLastSeen: item.latitude, 
                        longitudeLastSeen: item.longitude
                    }
                }, function (err, result) {
                    if (err != null) console.log(err);
                })
            }
            // New item found
            else {
                db.collection('epc').insertOne({
                    epcID: item.tagID,
                    dateFirstSeen: item.dateSeen,
                    dateLastSeen: item.dateSeen,
                    latitudeLastSeen: item.latitude,
                    longitudeLastSeen: item.longitude,
                    barcode: null
                }, function(err, result) {
                    if (err != null) console.log(err);
                });
            }                       
        });
    });
    callback();
}

var insert = function(db, cycleCount, items, callback) {
    db.collection('cycleCountTransactions').insertOne({
        _id: cycleCount.startTime,
        parent: cycleCount.parent,
        deptID: cycleCount.dept,
        floorpadID: cycleCount.floorPad,
        startTime: cycleCount.startTime,
        endTime: cycleCount.endTime,
        targetCount: cycleCount.targetCount,
        count: cycleCount.count,
        user: cycleCount.user
    }, function(err, result) {
        assert.equal(err, null);
        db.collection('epcHistory').insertMany(items, function(err, result) {  
            callback();
        });
    });
};

var findItems = function(db, floorPadId, deptId, callback) {
    list = [];
    var map = {};
    
    var epc_upc = db.collection('epc_upc').find({});
    epc_upc.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
            if (map[doc.upc]) {
                map[doc.upc].push(doc.epc);
            }
            else {
                map[doc.upc] = [doc.epc];
            }
      } else {
        var cursor = db.collection('items').find({ "FLR-PAD-ID": floorPadId, "DEPT-NBR": deptId });
        cursor.each(function(err, doc) {
          assert.equal(err, null);
          if (doc != null) {
              if (map[doc['UPC-NBR']]) {
                  list = list.concat(map[doc['UPC-NBR']])
                  delete map[doc['UPC-NBR']]; 
              }
          } else {
            callback(list);
          }
       });
      }
   });
};

var getCycleCountEpcs = function(db, parent, callback) {
    list = [];
    var cursor = db.collection('epcHistory').find({ "cycleCountID": parent });
    cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
          list.push(doc.tagID)
      } else {
         callback(list);
      }
   });
};

// Direct all other requests to index for angular router to take over
app.get('*', function(req, res) {
    res.render('index'); 
});

// Start application server
var server = app.listen(3000, '0.0.0.0', function(){
  console.log('Listening on port %d', server.address().port);
});
