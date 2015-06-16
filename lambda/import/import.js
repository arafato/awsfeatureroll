var mysql = require("mysql");
var parser = require("aws-featureroll-parser");

var connection = mysql.createConnection({
    host     : process.env.DBHOST,
    user     : process.env.DBUSER,
    password : process.env.DBPASSWORD,
    database : process.env.DATABASE
});

var year = new Date().getFullYear();

function getLastTimestamp(cb) {

    connection.query("select * from features order by unixtimestamp desc limit 1", function(err, result) {
	if (err) {
	    console.log(err);
	}
	else {
	    cb(result[0].unixtimestamp);
	}
    });
}

function insertNewFeatures(features) {

    for(var i = 0; i < features.length; ++i) {

	var feature = {
	    category : features[i].category,
	    published : features[i].date,
	    url : features[i].url,
	    unixtimestamp : features[i].timestamp,
	    title : features[i].title
	};
	
	connection.query('INSERT INTO features SET ?', feature, function(err, result) {
	    if(err) {
		console.log(err);
	    }
	    else if (result) {
		console.log("Successfully inserted feature: " + feature);
	    }
	});
    }
}

exports.handler = function(event, context) {
    parser.getFeatures(year, function(results) {
	connection.connect();
	getLastTimestamp(function(currentTimestamp) {
	    
	    for (var i = 0; i < results.length; ++i) {
		
		console.log(results[i].date + " <= " + currentTimestamp);
		
		if (results[i].timestamp <= currentTimestamp) {
		    
		    insertNewFeatures(results.splice(0, i));
		    break;
		}
	    }
	    
	    connection.end();
	});
    });
}
