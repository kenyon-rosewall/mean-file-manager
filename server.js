var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var p = require('path');
var crypto = require('crypto');

const ALG = 'aes-256-ctr';
const SALT = 'ff4EC3eh';
const AUDIO_DIR = 'mp3s';
const FORMATS = 	['.mp3', '.wav', '.ogg'];
const TYPES = 		['mpeg', 'wav', 'ogg'];
const USERS = 	[['kenyon','kenyon'],
				 ['test','test']];

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

function getFiles(files) {
	
	var out = new Array();
	var parent = {"name": "..", "type": "folder"};
	out.push(parent);
	
	for(var file in files) {
		var f = {};
		f.name = files[file];
		if( FORMATS.indexOf( files[file].substring( files[file].length-4) ) > -1 ) {
			f.type = 'audio';
		} else {
			f.type = 'folder';
		}
		out.push(f);
	}
	
	return out;
}

function renderPath(path) {
	var dir = p.normalize(path);
	
	return dir;
}

function encrypt(text) {
	var cipher = crypto.createCipher(ALG,SALT)
	var crypted = cipher.update(text,'utf8','hex')
	crypted += cipher.final('hex');
	return crypted;
}

function decrypt(text) {
	var decipher = crypto.createDecipher(ALG,SALT)
	var dec = decipher.update(text,'hex','utf8')
	dec += decipher.final('utf8');
	return dec;
}

function checkUser(username, password) {
	for(var user in USERS) {
		if(USERS[user][0] == username && USERS[user][1] == password) {
			
			return true;
		}
	}
	
	return false;
}

app.get('/files', function(req, res, next) {
	
	var path = renderPath('.');
	
	fs.readdir(p.join(AUDIO_DIR, path), function(err, files) {
		if(err) res.send(err);
		
		res.json(getFiles(files));
	});
});

app.get('/files/:path*', function(req, res) {
	var path = renderPath('/' + req.params[0]);
	var out = {};
	
	fs.readdir(p.join(AUDIO_DIR, path), function(err, files) {
		if(err) res.send(err);
		
		out.files = getFiles(files);
		out.path = path;
		res.json(out);
	});
});

app.get('/audio/:file*', function(req, res) {
	var path = renderPath(req.params.file + req.params[0]);
	
	fs.readFile(p.join(AUDIO_DIR, path), function(err, data) {
		if(err) res.send(err);
		
		var extension = p.extname(path);
		res.contentType('audio/' + TYPES[ FORMATS.indexOf(extension) ]);
		res.send(data);
	});
});

app.post('/folder/:name*', function(req, res) {
	var path = renderPath(req.params.name + '/' + req.params[0]);
	fs.mkdir(p.join('mp3s', path), function(err) {
		if(err) res.send(err);
		
		res.send(true);
	});
});

app.post('/upload/', function(req,res) {
	//DISABLED
});

app.post('/login', function(req, res) {
	var data = {};
	data.access_token = '';
	data.user = '';
	
	if(checkUser(req.body.user, req.body.password)) {
		data.access_token = encrypt(req.body.password);
		data.user = req.body.user;
	}
	
	res.json(data);
});

app.post('/authenticate', function(req, res) {
	var data = {};
	data.access_token = '';
	data.user = '';
	
	if(req.body.user != '' && req.body.accessToken != '') {
		if(checkUser(req.body.user, decrypt(req.body.accessToken))) {
			data = req.body;
		}
	}
	
	res.json(data);
});

app.get('*', function(req, res) {
	res.sendfile('./public/index.html');
});

app.listen(8081);
console.log("App listening on port 8081");