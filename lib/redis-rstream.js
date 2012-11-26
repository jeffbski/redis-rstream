'use strict';

var passStream = require('pass-stream');

function redisRStream(client, key, chunkSize) {
  if (!client || !key) throw new Error('redisRStream requires client and key');
  chunkSize = chunkSize || 64 * 1024;  // default 64KB
  var buffKey = new Buffer(key); // using Buffer key
  var stream = passStream();
  var readBytes = 0;
  function errored(err) {
    stream.emit('emit', err);
  }
  function readData() {
    client.getrange(buffKey, readBytes, readBytes + chunkSize - 1, function (err, buff) {
      if (err) return errored(err);
      if (!buff.length) return stream.end();
      readBytes += buff.length;
      if (stream.write(buff)) {
        process.nextTick(readData);
      } else { // couldn't write, so pause and wait for drain
        stream.once('drain', readData);  // restart the reading
      }
    });
  }
  process.nextTick(readData); // kick it off
  return stream;
}

module.exports = redisRStream;