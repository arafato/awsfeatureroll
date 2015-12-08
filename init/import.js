var mysql = require("mysql");
var parser = require("aws-featureroll-parser");

var connection = mysql.createConnection({
    host     : "",
    user     : "",
    password : "",
    database : ""
});

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
				
				if (year === endYear && i === features.length-1) {
					connection.end(function(err) {
						if (err) {
							throw err;
						}
						console.log("Successfully initialized DB.")
					});				
				}
			}
		});
    }
}

var endYear = new Date().getFullYear();
connection.connect();
for (var year = 2006; year <= endYear; ++year) {
	
	parser.getFeatures(year, function(results) {
	
		insertNewFeatures(results);
	});	
}

