var express = require('express');
var app = express();
var path = require('path');
var moment = require('moment');
var mysql = require('mysql');
var config = require('./config.js');

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {

    res.render('index');	
});


var categories = ["compute", "storagecdn", "database", "networking", "admin-sec", "deployment", "analytics", "appservice", "mobile", "enterprise", "other"];

/*
 * REST INTERFACE
 *
 * If no time(-range) parameter is given, the latest 10 features are returned.
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
app.get('/feature', function(req, res, next) {

    var startdate;
    if (req.query.startdate) {
	startdate = moment(startdate).unix();
	if (!startdate.isValid()) {
	    res.json({ error: "Invalid format of startdate. Use YYYY-MM-DD" });
	}
    }

    var enddate;
    if (req.query.enddate) {
	enddate = moment(enddate).unix();
	if (!enddate.isValid()) {
	    res.json({ error: "Invalid format of enddate. Use YYYY-MM-DD" });
	}
    }

    var category;
    if (req.query.cat) {
	if (categories.indexOf(req.query.cat) === -1) {
	    res.json( { error: "Unknown category. Following terms are supported: compute | storagecdn | database | networking | admin-sec | deployment | analytics | appservice | mobile | enterprise | other"  } );
	}

	category = req.query.cat;
    }

    var queryString = buildQueryString(startdate, enddate, category);
    
    var connection = mysql.createConnection({
	host     : config.dbhost,
	user     : config.dbuser,
	password : config.dbpwd,
	database : config.database,
	port: 3306
    });

    console.log(config);
    
    connection.connect();

    connection.query(queryString, function(err, result) {
	if(err) {
	    console.log(err);
	}
	else if (result) {
	    console.log("Successfully queried DB: " + result);
	    res.json(result);
	}
    });
    
    connection.end();
});

function buildQueryString(startdate, enddate, category) {

    var timeClause;
    if (startdate !== undefined && enddate !== undefined) {
	timeClause = "unixtimestamp between " + startdate + " and " + enddate;
    }
    else if (startdate === undefined && enddate !== undefined) {
	timeClause = "unixtimestamp <= " + enddate;
    }
    else if (startdate !== undefined && enddate === undefined) {
	timeClause = "unixtimestamp >= " + startdate;
    }

    var categoryClause;
    if (category !== undefined) {
	categoryClause = "where category = " + category;
    }

    if (timeClause !== undefined) {
	categoryClause = categoryClause + " and ";
    }

    var finalClause = "select * from features " +  categoryClause + timeClause + "order by category";

    return finalClause;
}

module.exports = app;
