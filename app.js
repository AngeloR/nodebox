var express = require('express')
	, filed = require('filed')
	, _ = require('underscore')
	, fs = require('fs')
	, querystring = require('querystring')
	, config = require('./config.js')
	, box = require('./box.js')
	, fermata = require('fermata');

var app = express();
app.use(express.bodyParser());

// just used to serve up our static "app.html" and create the 
// default session for this browser in redis
app.get('/', function(req, res){
	var app = filed('app.html');
	app.pipe(res);
	app.on('end', function(){
		return next(false);
	});
	return true;
});

app.get('/token/:token', function(req, res){
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
app.get('/auth/:service', function(req, res){
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
app.get('/authenticated/:service', function(req, res){

	if(config.supportedServices[req.params.service]) {
		switch(req.params.service) {
			case 'box':
				// we have authenticated, lets get the auth_token!
				res.redirect('/token/' + req.param('auth_token'));
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

// this should handle file uploads
// one of the params is the ticket.
app.post('/upload/:service/:token', function(req, res){
	if(config.supportedServices[req.params.service]) {
		switch(req.params.service) {
			case 'box':
				var data = {
					'folder_id': '106828534',
					'filename': req.files.file_upload.filename
				};

				var headers = {
					"Content-Type": "multipart/form-data",
					"Authorization": "BoxAuth api_key="+box.api.apikey+"&auth_token=" + req.params.token
				};

				var options = {
					uploadUrl: 'https://api.box.com/2.0/files/content'
				};

				
				var chunk = fs.readFileSync(req.files.file_upload.path);

				fermata.json(options.uploadUrl).post(headers, {
					fileField: {
						data: chunk,
						name: req.files.file_upload.filename
					},
					folder_id: '106828534',
					filename: req.files.file_upload.filename.split('.')[0]
				}, function(err, data){
					console.log(data, req.files.file_upload.filename.split('.')[0]);	
					res.send('Yep.');
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

app.listen(8080);