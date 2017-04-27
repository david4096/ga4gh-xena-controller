// ga4gh-xena-controller
//
// This file cpresents controller functions which can be used to access data
// from a Xena server using GA4GH RPC methods.
//
// It exports a module that accepts options, which are used to direct the
// controller at different Xena servers.
//
// For a simpler example see [ga4gh-base-controller](https://github.com/david4096/ga4gh-base-controller)

// We extend this module by adding our own named functions.
var controller = require('ga4gh-base-controller')({});

/*
Gene names from dataset

(query {:select [:field.name]
       :from [:field]
       :join [:dataset [:= :dataset.id :dataset_id]]
       :where [:= :dataset.name "jing.xena"]})

*/

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
  g4.id = feature.id;
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

controller.SearchBiosamples = function(call, callback) {
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

function pageToken(call, arr) {
  return parseInt(call.request.page_token, 10) + 1;
}

controller.SearchFeatures = function(call, callback) {
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

// This function adds default paging values to a controller function and
// returns the function having added default values. It is added as middleware.
function addPaging(fn) {
  return function(call, callback) {
    if (!call.request.page_size) {
      call.request.page_size = 10;
    }
    if (!call.request.page_token) {
      call.request.page_token = 0;
    }
    return fn(call, callback);
  }
}

// This function creates a limit string we can embed in a template that is
// used to create GA4GH style paging.
function limitString(call) {
  return `:limit ${parseInt(call.request.page_size, 10) + 1}
:offset ${call.request.page_size * call.request.page_token}`;
}

controller.SearchDatasets = function(call, callback) {
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

controller.SearchExpressionLevels = function(call, callback) {
  var query = `(map :value (query {:select [:value]
            :from [:dataset]
            :join [:field [:= :dataset.id :dataset_id]
            :code [:= :field.id :field_id]]
            :where [:and
            [:= :dataset.name ${call.request.dataset_name}]
            [:= :field.name "sampleID"]]}))`
  post(query, function(err, body) {
    callback(null, body);
  })
}

// Accepts a controller function and can be used to add functions that will be
// executed before the actual controller is executed.
function addMiddleware(fn) {
  return addPaging(fn);
}

Object.keys(controller).map(function(key) {
  controller[key] = addMiddleware(controller[key]);
});

module.exports = function (options) {
  post = require('./post')(options);
  return controller;
}
