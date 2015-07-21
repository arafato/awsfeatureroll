var YQL = require("yql");
var _s = require('underscore.string');

var CAT = {
    COMPUTE : "Compute",
    STORAGE_CDN : "Storage and Content Delivery",
    DATABASE : "Database",
    NETWORKING : "Networking",
    ADMIN_SEC : "Administration and Security",
    DEPLOY_MANAGE : "Deployment and Management",
    ANALYTICS : "Analytics",
    APPSERVICES : "Application Service",
    MOBILE : "Mobile Services",
    ENTERPRISEAPPS : "Enterprise Apps",
    OTHER : "Other"
};

var KEYWORDS = {};
KEYWORDS[CAT.COMPUTE] = ["ec2", "lambda", "container service", "ecs"];
KEYWORDS[CAT.STORAGE_CDN] = ["s3", "efs", "storage gateway", "glacier", "cloudfront", "elastic file system"];
KEYWORDS[CAT.DATABASE] = ["rds", "dynamodb", "elasticache", "redshift", "aurora", "mysql", "postgres", "oracle", "sql server"];
KEYWORDS[CAT.NETWORKING] = ["vpc", "direct connect", "route 53"];
KEYWORDS[CAT.ADMIN_SEC] = ["directory service", "iam", "trusted advisor", "cloudtrail", "config", "cloudwatch", "service catalog"];
KEYWORDS[CAT.DEPLOY_MANAGE] = ["beanstalk", "opsworks", "cloudformation", "codedeploy", "codecommit", "codepipeline"];
KEYWORDS[CAT.ANALYTICS] = ["emr", "hadoop", "kinesis", "data pipeline", "machine learning"];
KEYWORDS[CAT.APPSERVICES] = ["sqs", "swf", "appstream", "elastic transcoder", "ses", "cloudsearch", "email service", "queue service", "workflow service", "api gateway"];
KEYWORDS[CAT.MOBILE] = ["cognito", "mobile analytics", "sns", "device farm"];
KEYWORDS[CAT.ENTERPRISEAPPS] = ["workspaces", "workdocs", "zocalo", "workmail"];

var FeatureProto = {
    date: "",
    timestamp: "",
    title: "",
    url: "",
    category: ""
};

function parseDate(rawDate) {
    // Remove all linebreaks
    rawDate =  rawDate.replace(/(\r\n|\n|\r)/gm,'');
    // Remove all whitespaces
    rawDate =  rawDate.replace(/ /g,'');
    rawDate =  rawDate.replace(/PostedOn:/gi, '');
    
    return new Date(rawDate);
}

function extractCategory(title) {
    title = title.toLowerCase();
    for (var cat in KEYWORDS) {
	if (KEYWORDS.hasOwnProperty(cat)) {
	    for (var i = 0; i < KEYWORDS[cat].length; ++i) {
		if (title.indexOf(KEYWORDS[cat][i]) !== -1) {
		    return cat;
		}
	    }
	}
    }

    return CAT.OTHER;
}

function createFeature(raw) {
    var rawDate = raw.div[0].content;

    var title = raw.h3.a.content;
    var date = parseDate(rawDate);
    var url = raw.h3.a.href;
    var category = extractCategory(title);
    
    var feature = Object.create(FeatureProto);
    feature.date = date.toDateString();
    feature.timestamp = date.getTime()/1000|0;
    feature.title = title;
    feature.url = "https:" + url;
    feature.category = category;
    
    return feature;
}

function getFeatures(year, cb) {

    var yqlCssSelector = (year < 2014)
	? '.directory-list.whatsnew'
	: 'ul.directory-list.whats-new-detail';
    
    var yqlstring = _s.sprintf('select * from data.html.cssselect where url="http://aws.amazon.com/about-aws/whats-new/%s/" and css="%s"', year, yqlCssSelector);
    
    var features = [];    
    new YQL.exec(yqlstring, function(response) {

	var results = response.query.results.results.ul.li;
	for(var i=0; i<results.length;++i) {
	    var feature = createFeature(results[i]);
	    features.push(feature);
	}

	cb(features);
    });
}


module.exports = {
    getFeatures: getFeatures
};
