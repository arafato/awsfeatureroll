var express = require('express');
var path = require('path');
var moment = require('moment');
var mysql = require('mysql');
var config = require('./config.js');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {

    res.render('index');	
});


var categories = ["compute", "storagecdn", "database", "networking", "admin-sec", "deployment", "analytics", "appservice", "mobile", "enterprise", "other"];

/*
 * REST INTERFACE
 *
 * If no time(-range) parameter is given, all stored features ever released (since 2012) are returned.
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
	var momstart = moment(req.query.startdate);
	if (!momstart.isValid()) {
	    res.json({ error: "Invalid format of startdate. Use YYYY-MM-DD" });
	}
	
	startdate = momstart.unix();
    }

    var enddate;
    if (req.query.enddate) {
	var momend = moment(req.query.enddate);
	if (!momend.isValid()) {
	    res.json({ error: "Invalid format of enddate. Use YYYY-MM-DD" });
	}
	
	enddate = momend.unix();
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
    
    connection.connect();

    connection.query(queryString, function(err, result) {
	if(err) {
	    console.log(err);
	}
	else if (result) {
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
    else {
	timeClause = "";
    }

    var categoryClause;
    if (category !== undefined) {
	categoryClause = "category = '" + category.toLowerCase() + "'";
    }
    else {
	categoryClause = "";
    }

    if (timeClause !== "" && categoryClause !== "") {
	categoryClause = categoryClause + " and ";
    }

    var finalClause = "select * from features where " +  categoryClause + timeClause + " order by category";

    console.log(finalClause);
    
    return finalClause;
}

function mapCategoryName(cat) {

    switch(cat) {
	
    case "storagecdn":
	return "Storage and Content Delivery";
	break;
    case "admin-sec":
	return "Administration and Security";
	break;
    case "deployment":
	return "Deployment and Security";
	break;
    case "appservices":
	return "Application Services";
	break;
    case "mobile":
	return "Mobile Services";
	break;
    case "enterprise":
	return "Enterprise Apps";
	break;
    default:
	return cat;
    }
}

module.exports = app;
