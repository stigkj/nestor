var assert = require('assert'),
    Service = require('../../lib/service').Service,
    vows = require('vows');

vows.describe('Service').addBatch({
    'send': {
        'should call success callback when there is no error': function (topic) {
            var _statusCode, _headers, _data, _options, _encoding, _reqOnCount = 0, _reqEndCount = 0,
                successCb = function (statusCode, headers, data) {
                    _statusCode = statusCode;
                    _headers = headers;
                    _data = data;
                },
                errorCb = function (err) {
                    assert.fail('Error callback should not have been called.');
                },
                req = {
                    on: function (event, cb) {
                        if (event === 'error') {
                            _reqOnCount += 1;
                        }
                    },
                    end: function () {
                        _reqEndCount += 1;
                    }
                },
                res = {
                    statusCode: 200,
                    headers: { 'headerfield': 'headervalue' },
                    setEncoding: function (encoding) {
                        _encoding = encoding;
                    },
                    on: function (event, cb) {
                        if (event === 'data') {
                            cb(JSON.stringify({ 'datafield': 'datavalue' }));
                        } else if (event === 'end') {
                            cb();
                        }
                    }
                },
                http = {
                    request: function (options, cb) {
                        _options = options;
                        cb(res);
                        return req;
                    }
                },
                service = new Service('http://user:pass@localhost:8080', http);
            service.send('/api/json', 'GET', successCb, errorCb);
            assert.equal(_options.host, 'localhost');
            assert.equal(_options.port, 8080);
            assert.equal(_options.path, '/api/json');
            assert.equal(_options.method, 'GET');
            assert.equal(_options.headers.Authorization, 'Basic dXNlcjpwYXNz');
            assert.equal(_reqOnCount, 1);
            assert.equal(_reqEndCount, 1);
            assert.equal(_encoding, 'utf8');
            assert.equal(_statusCode, 200);
            assert.equal(_headers.headerfield, 'headervalue');
            assert.equal(_data, '{"datafield":"datavalue"}');
        },
        'should call error callback when there is an error on request': function (topic) {
            var _err, _options, _reqEndCount = 0,
                successCb = function (headers, data) {
                    assert.fail('Success callback should not have been called.');
                },
                errorCb = function (err) {
                    _err = err;
                },
                req = {
                    on: function (event, cb) {
                        if (event === 'error') {
                            errorCb(new Error('Unable to send request!'));
                        }
                    },
                    end: function () {
                        _reqEndCount += 1;
                    }
                },
                http = {
                    request: function (options, cb) {
                        _options = options;
                        return req;
                    }
                },
                service = new Service('http://localhost:8080', http);
            service.send('/api/json', 'GET', successCb, errorCb);
            assert.equal(_options.host, 'localhost');
            assert.equal(_options.port, 8080);
            assert.equal(_options.path, '/api/json');
            assert.equal(_options.method, 'GET');
            assert.equal(_reqEndCount, 1);
            assert.equal(_err.message, 'Unable to send request!');
        }
    }
}).export(module);