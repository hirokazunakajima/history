/*global __dirname, console, require*/
var doT = require('doT'),
	express = require('express'),
	app = express(),
	expressPort = 80,
	fs = require('fs'),
	path = require('path'),
	pub = __dirname + '/public',
	view =  __dirname + '/views',
	serveStaticPages = function (param) {
		var request = param.request,
			response = param.response,
			filePath = '.' + request.url.split('?')[0],
			loadHomePage = function () { // learn all the gallery folders
				var getGalleries = require('./admin/get_gallery_directories.js'),
				galleriesJson = getGalleries.init({ request: request, response: response, forNode: true }),
				galleries = galleriesJson.galleries,
				i,
				len = galleries.length;

				response.writeHead(200, {'Content-Type': 'text/html'});
				response.write("<h1>Photo Galleries</h1><ul>");

				for (i = 0; i < len; i+=1) {
					response.write('<li><a href="gallery-' + galleries[i] + '/gallery.xml">' + galleries[i] + '</li>');
				}
				response.write("</ul>");
				response.end('<a href="/admin/">Admin</a>');
			},
			isHomePage = filePath === './',
			isAdminLandingPage = (filePath === './admin' || filePath === './admin/'),
			isGalleryLandingPage = (filePath.indexOf('./gallery-') === 0 && filePath.lastIndexOf('/') === filePath.length - 1); // match gallery-xxx/ but not gallery-xxx; use this code to match without ending slash filePath.substr(filePath.indexOf('gallery-') + 'gallery-'.length).indexOf('/') === -1
		filePath = decodeURI(filePath); // handle spaces in path
		if (isHomePage) {
			loadHomePage();
			return;
		} else if (isAdminLandingPage) {
			filePath = filePath + '/index.htm';
		} else if (isGalleryLandingPage) {
			filePath = filePath + '/gallery.xml';
		}
			
		fs.exists(filePath, function(exists) {
			if (exists) {
				fs.readFile(filePath, function(error, content) {
					if (error) {
						response.writeHead(500);
						response.end();
					} else {
						response.contentType(path.extname(filePath));
						response.end(content, 'utf-8');
					}
				});
			}
			else {
				response.writeHead(404, {'Content-Type': 'text/html'});
				response.write("<h1>404 Not Found</h1>");
				response.end("The page you were looking for: " + filePath + " can not be found");
			}
		});
	};

app.use(express.bodyParser());

app.configure(function(){
	app.set("views", path.join(__dirname, "views"));
	app.engine("dot", require("dot-emc").init({app: app}).__express);
	app.set("view engine", "dot");
});

app.post(/resizeImages/, function(req, res){
	var imgResize = require('./admin/drag_images_to_resize.js');
	imgResize.init({request: req, response: res});
});

app.get(/getGalleries/, function(req, res){
	var getGalleries = require('./admin/get_gallery_directories.js');
	getGalleries.init({"request": req, "response": res, "forNode": false});
});

app.get(/(admin\/walk-path)/, function(req, res){
	res.render(
		'admin.node.dot',
		{
			"page": 'directory-list',
			"scripts": [
				'http://code.jquery.com/jquery-2.0.3.min.js',
				'/js/global.js',
				'/js/directory-contents.js',
				'/public/views.js'
			]
		}
	);
});
app.get(/(api\/walk-path)/, function(req, res){
	var api = require('./js/directory-contents-api.js');
	api.list({"request": req, "response": res});
});

app.get('*', function(req, res){
	serveStaticPages({request: req, response: res});
});

app.listen(expressPort);

console.log('Server running at http://localhost:' + expressPort);