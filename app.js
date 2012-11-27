// requires
var config = require('./config.js')		// just a list of services supported
	, restify = require('restify')		// npm installed
	, filed = require('filed')			// npm installed
	, _ = require('underscore')			// npm installed
	, redis = require('redis')			// wtf?! Database? Hells yes good sir. Session storage, needed for oauth
	, box = require('./box.js');		// the box api being written\

// init any objecst
var server = restify.createServer();
	//, client = redis.createClient();

server.use(restify.queryParser());

// just used to serve up our static "app.html" and create the 
// default session for this browser in redis
server.get('/', function(req, res){
	var app = filed('app.html');
	app.pipe(res);
	app.on('end', function(){
		return next(false);
	});
	return true;
});

server.get('/token/:token', function(req, res){
	var app= filed('app.html');
	app.pipe(res);
	app.on('end', function(){
		return next(false);
	});
	return true;
});

// hitting the "Login" button in the application triggers this. 
// It's written as a generic method that just needs to be extended 
// with the other services
server.get('/auth/:service', function(req, res){
	if(config.supportedServices[req.params.service]) {
		switch(req.params.service) {
			case 'box':
				box.api.getAuthUrl(function(ticket){
					// this url is unique for some damn reason. Fucking
					// box never bothered fixing it.
					var url = 'https://www.box.com/api/1.0/auth/' + ticket;

					// now that we have our ticket, we need to write it into 
					// redis referring to the cookie that we set so that we 
					// can easily map the auth_token back to this user
					res.send(url);
					res.end();
				});
			break;
			default: 
				res.statusCode = 400;
				res.end();
			break;
		}
	}
	else {
		res.statusCode = 404;
		res.end();
	}
	
	
});

// After oAuth authentication, the users are passed back to this end 
// point.
server.get('/authenticated/:service', function(req, res){

	if(config.supportedServices[req.params.service]) {
		switch(req.params.service) {
			case 'box':
				res.writeHead(302, {
					'Location': '/token/' + req.params.auth_token
				});
				res.end();
			break;
			default: 
				res.statusCode = 400;
				res.end();
			break;
		}
	}
	else {
		res.statusCode = 404;
		res.end();
	}
});

server.get('/upload/:service/:ticket', function(req, res){
	res.send('This.. SHOULD work...');
	res.end();
});

// this should handle file uploads
// one of the params is the ticket.
server.post('/upload/:service/', function(req, res){
	if(config.supportedServices[req.params.service]) {
		switch(req.params.service) {
			case 'box':

			break;
			default:
				res.statusCode = 400;
				res.end();
			break;
		}
	}
	else {
		res.statusCode = 404;
		res.end();
	}
});

server.listen(8080);