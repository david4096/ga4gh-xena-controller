// Accepts a Xena query and a callback, which will be run on the entirety of
// the response body on success, or immediately on error.
//
// This callback accepts error and body arguments. On success the error will
// be set to null.
const http = require('http');

var httpOptions = {
  hostname: 'toil.xenahubs.net',
  port: 80,
  path: '/data/',
  method: 'POST',
  headers: {
      'Content-Type': 'text/plain',
  }
};

function post (query, callback) {
  var req = http.request(httpOptions, function(res) {
    var body = "";
    res.setEncoding('utf8');
    res.on('error', function(e) {
      callback(e, null);
    })
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function() {
      callback(null, body);
    });
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  // write data to request body
  req.write(query);
  req.end();
}

module.exports = function(options) {
  if (options.hostname) {
    httpOptions.hostname = options.hostname;
  }
  if (options.port) {
    httpOptions.port = options.port;
  }
  if (options.path) {
    httpOptions.path = options.path;
  }
  return post;
}
