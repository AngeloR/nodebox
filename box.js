var _ = require('underscore')
	, creds = require('./creds.js')
	, http = require('http')
	, xml2js = require('xml2js');

var boxapi = {
	apikey: undefined

	, routes: {
		host: 'www.box.com'
		, api: '/api/1.0/rest?action='
		, ticket: 'get_ticket&api_key='
	}

	/**
	An array of all the pieces, in order that will be assembled
	into the final url (to work with signing and such).

	Don't pass in the root route and version, this takes care of 
	that
	**/
	, buildUrl: function(pieces) {
		s = '';
		
		pieces.unshift(this.routes.api);
		_.each(pieces, function(v){
			s += v;
		});
		return s;
	}

	, getAuthUrl: function(cb) {
		var ticket = this.getTicket(function(obj){
			if(obj.response.status[0] == 'get_ticket_ok') {
				cb(obj.response.ticket[0]);
				console.log(obj.response.ticket[0]);
			}
		});
	}

	, getTicket: function(cb) {
		var url = this.getTicketUrl();

		var req = http.request({
			host: this.routes.host
			, path: url
		}, function(res){
			var output = '';
			res.on('data', function(chunk) {
				output += chunk;
			});

			res.on('end', function(){
				var parser = new xml2js.Parser();
				parser.addListener('end', cb);
				parser.parseString(output);
			});			
		});

		req.on('error', function(err){
			console.log('error:' + err.message);
		});

		req.end();
	}
	
	, getTicketUrl: function() {
		var url = this.buildUrl([
				this.routes.ticket + creds.apikey
			]);

		return url;
	}
};



exports.api = boxapi;
exports.creds = creds;