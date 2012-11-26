/*global suite:false test:false */
'use strict';

var crypto = require('crypto');
var chai = require('chai-stack');
var spec = require('stream-spec');
var tester = require('stream-tester');
var redisRStream = require('..'); // require('redis-rstream');
var redis = require('redis');
var client = redis.createClient(null, null, { detect_buffers: true });

var t = chai.assert;

var KEY = 'foo';

suite('stream-spec');

var TEST_DATA_SIZE = 2 * 1024 * 1024 + 25; // 2,025KB
var TEST_DATA = crypto.randomBytes(TEST_DATA_SIZE);
var EXPECTED_DIGEST = crypto.createHash('sha1').update(TEST_DATA).digest('base64');

function setupDataForKey(cb) {
  client.set(KEY, TEST_DATA, cb);
}

function cleanup(cb) {
  client.del(KEY, cb);
}

before(function (done) { setupDataForKey(done); });
after(function (done) { cleanup(done); });

test('spec random pausing Buffer stream', function (done) {
  var stream = redisRStream(client, KEY);
  spec(stream)
    .readable()
    .pausable({strict: true})
    .validateOnExit();

  var accum = [];
  stream
    .pipe(tester.createPauseStream())
    .on('error', function (err) { done(err); })
    .on('data', function (data) { accum.push(data); })
    .on('end', function () {
      var allBuffer = Buffer.concat(accum);
      var allDigest = crypto.createHash('sha1').update(allBuffer).digest('base64');
      t.equal(allBuffer.length, TEST_DATA_SIZE);
      t.equal(allDigest, EXPECTED_DIGEST);
      done();
    });
});

