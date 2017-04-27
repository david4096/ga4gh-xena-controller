var limitString = require('./utils').limitString;
var pageToken = require('./utils').pageToken;

function convertFeature(call, feature) {
  var g4 = {};
  g4.feature_set_id = call.request.dataset_id;
  g4.name = feature.name;
  g4.id = feature.id;
  return g4;
}

function convertFeatures(call, features) {
  var parsed = JSON.parse(features);
  return parsed.map(function(feature) {
    return convertFeature(call, feature);
  })
}

module.exports = function(options) {
  var post = require('./post')(options);
  return function(call, callback) {
    // Since in Xena, each dataset has only one feature set, we can fudge by
    // calling the feature set ID the same as the dataset ID.
    var query = `(query {:select [:field.id :field.name]
           :from [:field]
           :join [:dataset [:= :dataset.id :dataset_id]]
           :where [:= :dataset.id ${call.request.dataset_id}]
           ${limitString(call)}})`
    post(query, function(err, body) {
      if (!err) {
        var response = {};
        response.features = convertFeatures(call, body);
        if (response.features.length > call.request.page_size) {
          response.features.pop();
          response.next_page_token = pageToken(call);
        }
        callback(null, response);
      }
    });
  }
}
