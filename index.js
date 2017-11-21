"use strict";
/* global __dirname */

var express = require("express");
var bodyParser = require("body-parser");
var helmet = require("helmet");
var path = require('path');

var  MongoClient = require('mongodb').MongoClient;

var mdbURL = "mongodb://nlg:nlg@ds149535.mlab.com:49535/si1718-nlg-papers";

var port = (process.env.PORT || 10000);
var BASE_API_PATH = "/api/v1";

var db;


MongoClient.connect(mdbURL,{native_parser:true},function (err,database){

    if(err){
        console.log("CAN NOT CONNECT TO DB: "+err);
        process.exit(1);
    }
    
    db = database.collection("papers");
    

    app.listen(port, () => {
        console.log("Magic is happening on port " + port);    
    });

});

var app = express();

app.use(bodyParser.json()); //use default json enconding/decoding
app.use(helmet()); //improve security


// GET a collection
app.get(BASE_API_PATH + "/papers", function (request, response) {
    console.log("INFO: New GET request to /papers");
    db.find({}).toArray( function (err, papers) {
        if (err) {
            console.error('WARNING: Error getting data from DB');
            response.sendStatus(500); // internal server error
        } else {
            console.log("INFO: Sending papers: " + JSON.stringify(papers, 2, null));
            response.send(papers);
        }
    });
});


// GET a single resource
// GET a single resource
app.get(BASE_API_PATH + '/papers/:id', function(req, res) {
    var id = req.params.id;
    if (!id) {
        console.log("WARNING: New GET request to /dissertations/:id without id, sending 400...");
        res.sendStatus(400);
    }
    else {
        console.log("INFO: New GET request to /dissertations/" + id);
        db.findOne({ "title": id }, (err, element) => {
            if (err) {
                console.error('WARNING: Error getting data from DB');
                res.sendStatus(500);
            }
            else {
                if (element) {
                    console.log("INFO: Sending dissertation: " + JSON.stringify(element, 2, null));
                    res.send(element);
                }
                else {
                    console.log("WARNING: There is not any dissertation with id " + id);
                    res.sendStatus(404);
                }
            }
        });
    }
});



//POST over a collection
app.post(BASE_API_PATH + "/papers", function (request, response) {
    var newpapers = request.body;
    if (!newpapers) {
        console.log("WARNING: New POST request to /papers/ without contact, sending 400...");
        response.sendStatus(400); // bad request
    } else {
        console.log("INFO: New POST request to /papers with body: " + JSON.stringify(newpapers, 2, null));
        if (!newpapers.title || !newpapers.conference || !newpapers.authors) {
            console.log("WARNING: The contact " + JSON.stringify(newpapers, 2, null) + " is not well-formed, sending 422...");
            response.sendStatus(422); // unprocessable entity
        } else {
            db.find({}, function (err, papers) {
                if (err) {
                    console.error('WARNING: Error getting data from DB');
                    response.sendStatus(500); // internal server error
                } else {
                    var papersBeforeInsertion = papers.filter((paper) => {
                        return (paper.title.localeCompare(newpapers.title, "en", {'sensitivity': 'base'}) === 0);
                    });
                    if (papersBeforeInsertion.length > 0) {
                        console.log("WARNING: The contact " + JSON.stringify(newpapers, 2, null) + " already extis, sending 409...");
                        response.sendStatus(409); // conflict
                    } else {
                        console.log("INFO: Adding contact " + JSON.stringify(newpapers, 2, null));
                        db.insert(newpapers);
                        response.sendStatus(201); // created
                    }
                }
            });
        }
    }
});


//POST over a single resource
app.post(BASE_API_PATH + "/papers/:title", function (request, response, next) {
    var name = request.params.title;
    console.log("WARNING: New POST request to /Papers/" + name + ", sending 405...");
    response.sendStatus(405); // method not allowed
});


//PUT over a collection
app.put(BASE_API_PATH + "/papers", function (request, response) {
    console.log("WARNING: New PUT request to /Papers, sending 405...");
    response.sendStatus(405); // method not allowed
});


//PUT over a single resource
app.put(BASE_API_PATH + "/papers/:name", function (request, response) {
    var updatedPapers = request.body;
    var name = request.params.name;
    if (!updatedPapers) {
        console.log("WARNING: New PUT request to /Papers/ without paper, sending 400...");
        response.sendStatus(400); // bad request
    } else {
        console.log("INFO: New PUT request to /Papers/" + name + " with data " + JSON.stringify(updatedPapers, 2, null));
        if (!updatedPapers.title || !updatedPapers.conference || !updatedPapers.authors) {
            console.log("WARNING: The paper " + JSON.stringify(updatedPapers, 2, null) + " is not well-formed, sending 422...");
            response.sendStatus(422); // unprocessable entity
        } else {
            db.findOne({ "title": name }, (err, papers) => {
                if (err) {
                    console.error('WARNING: Error getting data from DB');
                    response.sendStatus(500); // internal server error
                    
                        } else {
                    
                    db.update({title: name}, updatedPapers);
                        console.log("INFO: Modifying Papers with name " + name + " with data " + JSON.stringify(updatedPapers, 2, null));
                        response.send(updatedPapers); // return the updated paper
                    
                }

            });
        } 
    }
});


//DELETE over a collection
app.delete(BASE_API_PATH + "/papers", function (request, response) {
    console.log("INFO: New DELETE request to /papers");
    db.remove({}, {multi: true}, function (err, numRemoved) {
        if (err) {
            console.error('WARNING: Error removing data from DB');
            response.sendStatus(500); // internal server error
        } else {
            if (numRemoved > 0) {
                console.log("INFO: All the papers (" + numRemoved + ") have been succesfully deleted, sending 204...");
                response.sendStatus(204); // no content
            } else {
                console.log("WARNING: There are no papers to delete");
                response.sendStatus(404); // not found
            }
        }
    });
});


//DELETE over a single resource
app.delete(BASE_API_PATH + "/papers/:name", function (request, response) {
    var name = request.params.name;
    if (!name) {
        console.log("WARNING: New DELETE request to /papers/:name without name, sending 400...");
        response.sendStatus(400); // bad request
    } else {
        console.log("INFO: New DELETE request to /papers/" + name);
        db.remove({title: name}, {}, function (err, numRemoved) {
            if (err) {
                console.error('WARNING: Error removing data from DB');
                response.sendStatus(500); // internal server error
            } else {
                console.log("INFO: Papers removed: " + numRemoved);
                if (numRemoved === 1) {
                    console.log("INFO: The Papers with name " + name + " has been succesfully deleted, sending 204...");
                    response.sendStatus(204); // no content
                } else {
                    console.log("WARNING: There are no papers to delete");
                    response.sendStatus(404); // not found
                }
            }
        });
    }
});
