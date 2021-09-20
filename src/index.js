'use strict';

exports.handler = (event, context, callback) => {

  // authentication credentials
  var i = 0, authStrings = [], authCredentials = [
    'devops:awesome'
  ];

  // construct Basic Auth strings
  authCredentials.forEach(element => {
      authStrings[i] = "Basic " + new Buffer(element).toString('base64');
      i++;
    }
  );

  // get request and request headers
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  // require Basic authentication
  if (typeof headers.authorization == 'undefined' || 
    !authStrings.includes(headers.authorization[0].value)) {

    const response = {
      status: '401',
      statusDescription: 'Unauthorized',
      body: 'Unauthorized',
      headers: {
        'www-authenticate': [ {key: 'WWW-Authenticate', 
                             value: 'Basic realm="Authentication"'} ]
      },
    };

    callback(null, response);
  }

  // continue request processing if authentication passed
  callback(null, request);
};
