var express = require('express');
var path = require('path');
var mysql = require('mysql');
var config = require('./config.js');
var queryUtils = require('./queryUtils.js');
var archiver = require('archiver');
var fs = require('fs');
var moment = require('moment');

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

/* 
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
app.get('/api/slides', function(req, res) {
    var startdate = moment(req.query.startdate);
    var enddate = moment(req.query.enddate);
    if (!startdate.isValid() || !enddate.isValid()) {
	res.status(500).send({error: 'invalid date format: use MM-DD-YYYY'});
    }
    
    var connection = mysql.createConnection({
	host     : config.dbhost,
	user     : config.dbuser,
	password : config.dbpwd,
	database : config.database,
	port: 3306
    });

    connection.connect();
    
    queryUtils.getFeatures(connection, req.query, function(json) {
	json = JSON.stringify(json);
	var result = JSON.parse(json);
	var features = {};
	for(var i = 0; i < result.length; ++i) {
	    
	    if (features[result[i].category] === undefined) {
		features[result[i].category] = [];
	    }
	    
	    features[result[i].category].push(result[i]);
	}

	var author =  req.query.author || 'Amazon Web Services';
	var twitter = req.query.twitter || 'AWS_Aktuell';
	var title = req.query.title || 'AWS Feature Update';
	
	res.render('revealjs-slides',
		   {
		       allFeatures: features,
		       author: author,
		       title: title,
		       twitter: twitter,
		       startdate: startdate.format('MMMM Do'),
		       enddate: enddate.format('MMMM Do YYYY')
		   },
		   function(err, html) {
		       if (err) {
			   console.log(err);
			   return;
		       }
		       
		       var archive = archiver('zip');
	    
		       archive.on('error', function(err) {
			   console.log('error: ' + err);
			   res.status(500).send({error: err.message});
		       });
		       
		       res.on('close', function() {
			   return res.status(200).send('OK').end();
		       });
		       
		       res.attachment('aws-feature-slidedeck.zip');
		       
		       archive.pipe(res);
		       var p = path.join(__dirname, 'public/revealjs-template/');
		       
		       archive.bulk([
			   { expand: true, cwd: p, src: ['**'] }
		       ]);
		       
		       archive.append(html, { name: 'index.html' });
	    	       
		       archive.finalize();
		   });
    });
    
    connection.end();
});

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
