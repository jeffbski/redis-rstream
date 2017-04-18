'use strict';
/*global setImmediate:false */

var Stream = require('stream');
var util = require('util');
var ReadableStream = require('readable-stream');

// node 0.10+ has Writable stream so use it if available
// otherwise use readable-stream module
var Readable = Stream.Readable || ReadableStream.Readable;

function RedisRStream(client, key, options) {
  if (!client || !key) throw new Error('RedisRStream requires client and key');
  // allow call without new
  if (!(this instanceof RedisRStream)) return new RedisRStream(client, key, options);
  Readable.call(this, options);
  this._redisClient = client;
  this._redisKey = new Buffer(key); // using Buffer key so redis returns buffers
  this._redisChunkSize = (options && options.chunkSize) ? options.chunkSize : 64 * 1024;  // default 64KB
  this._redisMaxPendingReads = (options && options.maxPendingReads) ? options.maxPendingReads : 2;
  this._redisOffset = (options && options.startOffset) ? options.startOffset : 0;
  this._redisStartOffset = (options && options.startOffset) ? options.startOffset : 0;
  this._redisEndOffset = (options && options.endOffset) ? options.endOffset : 0;
  this._redisLength = 0;
  this._redisEnded = false;
  this._redisPendingReads = 0;
}

util.inherits(RedisRStream, Readable);

RedisRStream.prototype._read = function _read(size) {
  var self = this;
  if (self._redisPendingReads >= self._redisMaxPendingReads) return;
  size = size || self._redisChunkSize;
  var startOffset = self._redisOffset;
  var endOffset = startOffset + size - 1;
  if(self._redisEndOffset !== 0) {
      // -1 is due to the inclusive nature or redis getrange
      endOffset = Math.min(self._redisEndOffset - 1, endOffset);
  }
  self._redisOffset = endOffset + 1;
  self._redisPendingReads += 1;
  self._redisClient.getrange(self._redisKey, startOffset, endOffset, function (err, buff) {
    self._redisPendingReads -= 1;
    if(buff) {
        self._redisLength += buff.length;
    }
    if (err) return self.emit('error', err);
    if (!buff.length) {
      if (!self._redisEnded) {
        self._redisEnded = true;
        self.push(null); // ended
      }
      return;
    }
    if (self.push(buff)) { // continue reading
        if(self._redisEndOffset !== 0 && self._redisLength >= (self._redisEndOffset - self._redisStartOffset) || buff.length < (endOffset - startOffset)) {
            if (!self._redisEnded) {
                self._redisEnded = true;
                self.push(null); // ended
            }
            return;
        }
      process.nextTick(function () { self._read(size); });
    }
  });
};

module.exports = RedisRStream;