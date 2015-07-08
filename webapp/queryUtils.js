var moment = require('moment');

var categories = ["compute", "storagecdn", "database", "networking", "admin-sec", "deployment", "analytics", "appservice", "mobile", "enterprise", "other"];

function getFeatures(connection, queryParams, cb) {

    var params = { startdate: undefined, enddate: undefined, category: undefined };
    sanitizeParams(params, queryParams);
    var queryString = buildQueryString(params.startdate, params.enddate, params.category);

    connection.query(queryString, function(err, result) {
	if(err) {
	    console.log(err);
	}
	else if (result) {
	    cb(result);
	}
    });
}

function sanitizeParams(params, queryParams) {
     
    if (queryParams.startdate) {
	var momstart = moment(queryParams.startdate);
	if (!momstart.isValid()) {
	    throw "Invalid format of startdate. Use YYYY-MM-DD";
	}
	
	params.startdate = momstart.unix();
    }

    if (queryParams.enddate) {
	var momend = moment(queryParams.enddate);
	if (!momend.isValid()) {
	    throw "Invalid format of enddate. Use YYYY-MM-DD";
	}
	
	params.enddate = momend.unix();
    }

    if (queryParams.cat) {
	if (categories.indexOf(queryParams.cat) === -1) {
	    throw "Unknown category. Following terms are supported: compute | storagecdn | database | networking | admin-sec | deployment | analytics | appservice | mobile | enterprise | other";
	}

	params.category = queryParams.cat;
    }
}

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
	categoryClause = "category = '" + mapCategoryName(category.toLowerCase()) + "'";
    }
    else {
	categoryClause = "";
    }

    if (timeClause !== "" && categoryClause !== "") {
	categoryClause = categoryClause + " and ";
    }

    var finalClause = "select * from features where " +  categoryClause + timeClause + " order by category";

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
	return "Deployment and Management";
	break;
    case "appservice":
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

module.exports = {

    getFeatures: getFeatures
};
