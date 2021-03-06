var express = require('express');
var path = require('path');
var mysql = require('mysql');
var archiver = require('archiver');
var fs = require('fs');
var moment = require('moment');

var config = require('./config.js');
var queryUtils = require('./queryUtils.js');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
// Enable CORS for every origin
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.set('view engine', 'ejs');

app.get('/', function (req, res) {

    res.render('index');	
});

/*
 * REST INTERFACE
 */

/* If no time(-range) parameter is given, all stored features ever released are returned.
 * 
 * Query parameters:
 * 
 * cat (optional) - compute | storagecdn | database | networking | admin-sec | deployment |
 *       analytics | appservice | mobile | enterprise | other
 *
 * startdate (optional) - YYYY-MM-DD
 * if without dateend, all matching items until current date are returned
 * 
 * enddate (optional) - YYYY-MM-DD
 * if without datestart, all matching items until earliest date are returned
*/
app.get('/api/feature', function(req, res) {

    var connection = mysql.createConnection({
	host     : config.dbhost,
	user     : config.dbuser,
	password : config.dbpwd,
	database : config.database,
	port: 3306
    });

    connection.connect();
    
    queryUtils.getFeatures(connection, req.query, function(result) {
	res.json(result);
    });

    connection.end();
});

module.exports = app;
