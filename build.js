// marked for Markdown parsing
var marked = require('marked');
// Configure marked before loading jade
marked.setOptions({
	langPrefix: "prettyprint lang-",
	gfm: true,
	tables: true,
	breaks: true,
	pedantic: false,
	sanitize: false,
	silent: false
});
// jade for templating
var jade = require('jade');
// fs for FileSystem operations
var fs = require('fs');
// path for FileSystem operations
var path = require('path');
// wrench for fixing node
var wrench = require('wrench');
// walk for content generation
var walk = require('findit');

// Load the template
var template = fs.readFileSync(__dirname + '/template.jade').toString();

// Walk the content directory
var walker = walk(__dirname + '/content');

// Clear the dist directory
wrench.rmdirSyncRecursive(__dirname + '/dist');

// Deep copy the static assets
wrench.copyDirSyncRecursive(__dirname + '/static', __dirname + '/dist');

// When a directory is found
walker.on('directory', function (dir, stat, stop) {
	// If it's an assets directory
	if (path.basename(dir) === 'assets') {
		// Don't walk it
		stop();
		// Get the destination for the dir
		var dest_dir = path.join('dist', path.relative(path.join(__dirname, 'content'), dir));
		// Make the parent directory in the destination
		wrench.mkdirSyncRecursive(path.dirname(dest_dir));
		// Copy the assets dir to it
		wrench.copyDirSyncRecursive(dir, dest_dir);
	}
});

// When a file is found
walker.on("file", function (file, stat) {
	// Read in the file
	fs.readFile(file, function (err, data) {
		var json = '';
		data.toString().split("\n").forEach(function(line) {
			// If it's a comment
			if (line.trim().substring(0, 4) === "//-;") {
				// Execute it
				json += (line.trim().substring(4)).trim() + "\n";
			}
		});
		// Generate the location for the generated file
		var location = path.relative(path.join(__dirname, 'content'), file);
		location = location.substring(0, location.length - 5);
		// Copy the template and render it
		page = jade.compile(
			template.replace("___INCLUDE___", location), {
				pretty: true,
				filename: 'template.jade'
			}
		)(JSON.parse(json));
		location = path.join('dist', location + '.html');
		// Make the directory
		wrench.mkdirSyncRecursive(path.dirname(location));
		// Write to a file
		fs.writeFileSync(
			location,
			page
		);
	});
});