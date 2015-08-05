var express = require('express');
var path = require('path');
var archiver = require('archiver');
var fs = require('fs');
var moment = require('moment');
var http = require('http');

var config = require('./config.js');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
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
 * SLIDES SERVICE
 */
app.get('/api/slides', function(req, res) {

    if (req.query.startdate === undefined || req.query.enddate === undefined) {
	res.status(500).send({error: 'You must specify a start and end date: use MM-DD-YYYY format'});
    }
    
    var startdate = moment(req.query.startdate);
    var enddate = moment(req.query.enddate);

    if (!startdate.isValid() || !enddate.isValid()) {
	res.status(500).send({error: 'invalid date format: use MM-DD-YYYY'});
    }

    var options = {
	host: config.featureHost,
	port: config.featurePort,
	path: config.featurePath + "startdate=" + req.query.startdate + "&enddate=" + req.query.enddate
    };
    
    http.request(options, function(resp) {
	var data = '';
	resp.on('data', function(chunk) {
	    data += chunk;
	});
	resp.on('end', function() {
	    
	    var features = processFeatures(data);
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
			   
			   var archive = createArchive(html);

			   archive.on('error', function(err) {
			       console.log('error: ' + err);
			       res.status(500).send({error: err.message});
			   });
			   
			   res.on('close', function() {
			       return res.status(200).send('OK').end();
			   });
			   
			   res.attachment('aws-feature-slidedeck.zip');
			   archive.pipe(res);
		       });
	});
    }).end();
});

function createArchive(html) {
    var archive = archiver('zip');
    var p = path.join(__dirname, 'public/revealjs-template/');
    archive.bulk([
	{ expand: true, cwd: p, src: ['**'] }
    ]);
    archive.append(html, { name: 'index.html' });
    archive.finalize();

    return archive;
}

function processFeatures(result) {

    result = JSON.stringify(result);
    // FIXME: If I don't create a second object(o) and call JSON.parse twice I just get back a string...
    result = JSON.parse(result);
    var o = JSON.parse(result);
    
    var features = {};
    for(var i = 0; i < o.length; ++i) {
	
	if (features[o[i].category] === undefined) {
	    features[o[i].category] = [];
	}
	
	features[o[i].category].push(o[i]);
    }
    
    return features;
}

module.exports = app;
