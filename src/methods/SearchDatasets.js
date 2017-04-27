var limitString = require('./utils').limitString;
var pageToken = require('./utils').pageToken;

function convertDataset(dataset) {
  // Convert our Xena document to G4 schema
  var text;
  try {
    text = JSON.parse(dataset.text);
  } catch(e) {
    text = {description: dataset.text};
  }
  var g4 = {};
  g4.name = dataset.name;
  g4.id = dataset.id;
  g4.description = text.description;
  return g4;
}

module.exports = function(options) {
  var post = require('./post')(options);
  return function(call, callback) {
    var query = `(query
      {:select
        [:id :name :shorttitle :cohort :rows :type :datasubtype :probemap :text :status]
        :from [:dataset]
        ${limitString(call)}})`;
    post(query, function(err, body) {
      var datasets = JSON.parse(body);
      if (!err) {
        var response = {};
        if (datasets.length > call.request.page_size) {
          datasets.pop();
          response.next_page_token = pageToken(call);
        }
        response.datasets = datasets.map(convertDataset);
        callback(null, response);
      } else {
        callback(err, body);
      }
    })
  }
}
