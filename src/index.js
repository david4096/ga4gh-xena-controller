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

var limitString = require('./utils').limitString;
var pageToken = require('./utils').pageToken;

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


// Accepts a controller function and can be used to add functions that will be
// executed before the actual controller is executed.
function addMiddleware(fn) {
  return addPaging(fn);
}

module.exports = function (options) {
  // Attach the controllers we've named.
  controller.SearchBiosamples = require('./methods/SearchBiosamples')(options);
  controller.SearchFeatures = require('./methods/SearchFeatures')(options);
  controller.SearchDatasets = require('./methods/SearchDatasets')(options);
  controller.SearchExpressionLevels = function(call, callback) {
    var query = `(let [probemap (:probemap (car (query {:select [:probemap]
                                      :from [:dataset]
                                      :where [:= :id ${call.request.dataset_id}]})))
     probes-for-gene (fn [gene] ((xena-query {:select ["name"] :from [probemap] :where [:in :any "genes" [gene]]}) "name"))
     avg (fn [scores] (mean scores 0))
     scores-for-gene (fn [gene]
         (let [probes (probes-for-gene gene)
               scores (fetch [{:table ${call.request.dataset_id}
                               :samples %${call.request.samples}
                               :columns (probes-for-gene gene)}])]
           {:gene gene
            :scores (if (car probes) (avg scores) [[]])}))]
 (map scores-for-gene ${call.request.genes}))`;
  }
  // And apply any middleware we've made.
  Object.keys(controller).map(function(key) {
    controller[key] = addMiddleware(controller[key]);
  });

  return controller;
}
