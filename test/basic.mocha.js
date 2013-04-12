/*global suite:false test:false */
'use strict';

var chai = require('chai-stack');
var crypto = require('crypto');
var redisRStream = require('..'); // require('redis-rstream');
var redis = require('redis');
var client = redis.createClient(null, null, { detect_buffers: true });


var t = chai.assert;

var KEY = 'foo';

suite('basic');

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

test('basic use streams2 binary data from key', function (done) {
  var stream = redisRStream(client, KEY);
  var accum = [];
  stream
    .on('error', function (err) { done(err); })
    .on('readable', function () {
      var data;
      while ((data = stream.read()) !== null) {
        accum.push(data);
      }
    })
    .on('end', function () {
      var allBuffer = Buffer.concat(accum);
      var allDigest = crypto.createHash('sha1').update(allBuffer).digest('base64');
      t.equal(allDigest, EXPECTED_DIGEST);
      done();
    });
});

test('basic use stream binary data from key, defaults to 64KB chunks', function (done) {
  var stream = redisRStream(client, KEY);
  var accum = [];
  stream
    .on('error', function (err) { done(err); })
    .on('data', function (data) {
      accum.push(data);
    })
    .on('end', function () {
      var allBuffer = Buffer.concat(accum);
      var allDigest = crypto.createHash('sha1').update(allBuffer).digest('base64');
      t.equal(allDigest, EXPECTED_DIGEST);
      done();
    });
});



test('all arguments missing for factory, throws error', function () {
  function throwsErr() {
    var stream = redisRStream();
  }
  t.throws(throwsErr, /RedisRStream requires client and key/);
});

test('client null, throws error', function () {
  function throwsErr() {
    var stream = redisRStream(null, KEY);
  }
  t.throws(throwsErr, /RedisRStream requires client and key/);
});

test('key null, throws error', function () {
  function throwsErr() {
    var stream = redisRStream(client, null);
  }
  t.throws(throwsErr, /RedisRStream requires client and key/);
});

