// TODO
function convertBiosample(biosample) {
  var g4 = {};

}

module.exports = function(options) {
  var post = require('./post')(options);
  return function(call, callback) {
    var query = `(query {:select [:*]
                      :from [:dataset]
                      :join [:field [:= :dataset.id :dataset_id]
                             :code [:= :field_id :field.id]]
                      :where [:= :field.name "sampleID"]
                      :limit ${call.request.page_size}
                      :offset ${call.request.page_size * call.request.page_token}})`;
    post(query, function(err, body) {
      callback(null, body);
    });
  }
}
