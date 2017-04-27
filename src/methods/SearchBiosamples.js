var limitString = require('../utils').limitString;
var pageToken = require('../utils').pageToken;

// TODO
function convertBiosample(biosample) {
  var g4 = {};
  g4.name = biosample.value;
  g4.description = biosample.cohort;
  g4.id = biosample.id_3;
  return g4;
}

module.exports = function(options) {
  var post = require('../post')(options);
  // TODO how do we grab the number ID columns? what do they mean?
  return function(call, callback) {
    var query = `(query {:select [:*]
                      :from [:dataset]
                      :join [:field [:= :dataset.id :dataset_id]
                             :code [:= :field_id :field.id]]
                      :where [:= :field.name "sampleID"]
                      ${limitString(call)}})`;
    post(query, function(err, body) {
      var response = {};
      var biosamples = JSON.parse(body);
      if (biosamples.length > call.request.page_size) {
        biosamples.pop();
        response.next_page_token = pageToken(call);
      }
      response.biosamples = biosamples.map(convertBiosample);
      callback(null, response);
    });
  }
}
