var request = require('request');
var controller = require('ga4gh-base-controller')({});
var url = "https://singlecell.xenahubs.net/data/";

var http = require("http");
var options = {
  hostname: 'toil.xenahubs.net',
  port: 80,
  path: '/data/',
  method: 'POST',
  headers: {
      'Content-Type': 'text/plain',
  }
};
/*
Gene names from dataset

(query {:select [:field.name]
       :from [:field]
       :join [:dataset [:= :dataset.id :dataset_id]]
       :where [:= :dataset.name "jing.xena"]})

*/

function post(query, callback) {
  var req = http.request(options, function(res) {
    var body = "";
    console.log('Status: ' + res.statusCode);
    console.log('Headers: ' + JSON.stringify(res.headers));
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

function convertFeature(call, feature) {
  var g4 = {};
  g4.feature_set_id = call.request.dataset_id;
  g4.name = feature.name;
  return g4;
}

function convertFeatures(call, features) {
  var parsed = JSON.parse(features);
  return parsed.map(function(feature) {
    return convertFeature(call, feature);
  })
}

// TODO
function convertBiosample(biosample) {
  var g4 = {};

}

controller.searchBiosamples = function(call, callback) {
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

controller.searchFeatures = function(call, callback) {
  var query = `(query {:select [:field.id :field.name]
         :from [:field]
         :join [:dataset [:= :dataset.id :dataset_id]]
         :where [:= :dataset.id ${call.request.dataset_id}]
         :limit ${call.request.page_size}
         :offset ${call.request.page_size * call.request.page_token}})`
  post(query, function(err, body) {
    if (!err) {
      var response = {};
      response.features = convertFeatures(call, body);
      callback(null, response);
    }
  });
}

controller.searchDatasets = function(call, callback) {
  var query = '(query {:select [:id :name :shorttitle :cohort :rows :type :datasubtype :probemap :text :status] :from [:dataset]})'
  post(query, function(err, body) {
    if (!err) {
      var response = {};
      response.datasets = JSON.parse(body).map(convertDataset);
      callback(null, response);
    } else {
      callback(err, body);
    }
  })
}
controller.searchExpressionLevels = function(call, callback) {
  var query = `(map :value (query {:select [:value]
            :from [:dataset]
            :join [:field [:= :dataset.id :dataset_id]
            :code [:= :field.id :field_id]]
            :where [:and
            [:= :dataset.name %s]
            [:= :field.name "sampleID"]]}))`
  post(query, function(err, body) {
    callback(null, body);
  })
}

module.exports = function (options) {
  return controller;
}
