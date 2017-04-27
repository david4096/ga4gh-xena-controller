// Utilities for working with data across protocols.

// This function creates a limit string we can embed in a template that is
// used to create GA4GH style paging.
function limitString(call) {
  return `:limit ${parseInt(call.request.page_size, 10) + 1}
:offset ${call.request.page_size * call.request.page_token}`;
}

function pageToken(call, arr) {
  return parseInt(call.request.page_token, 10) + 1;
}

module.exports = {
  limitString: limitString,
  pageToken: pageToken
}
