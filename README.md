# redis-rstream

redis-rstream is a node.js redis read stream which streams binary or utf8 data in chunks from a redis key using an existing redis client. Tested with mranney/node_redis client.

[![Build Status](https://secure.travis-ci.org/jeffbski/redis-rstream.png?branch=master)](http://travis-ci.org/jeffbski/redis-rstream)

## Installation

```bash
npm install redis-rstream
```

You will also need the `redis` client (`npm install redis`) or other compatible library. You an also optionally install `hiredis` along with `redis` for additional performance.

## Usage

Construct a read stream instance by passing in `client`, redis `key`, and optionally a `chunkSize` to stream data from. The default `chunkSize` (the size of the data packets in the stream) is 64KB. Be sure to enable an option in your client to return Buffers for the data, like `detect_buffers: true` so that binary data will be read properly.

```javascript
var redis = require('redis');
var redisRStream = require('redis-rstream'); // factory
var client = redis.createClient(null, null, {detect_buffers: true}); // create client using your options and auth
redisRStream(client, 'keyToStreamFrom')  // create instance of read stream w/default 64KB chunk size
  .pipe(...)
```

Tested with mranney/node_redis client, but should work with any client that implements:

 - `getrange(key, start, stop, cb)` - where key is a Buffer and the data returned is a Buffer


## Goals

 - Simple read stream which can use existing redis client (and especially mranney/node_redis)
 - Remove all the complexity of managing a stream and reading in chunks from a redis key
 - Create normal pausable node.js read stream which can be piped or used as any other stream
 - stream-spec compliant node.js read stream

## Why

mranney/node_redis does not have direct ability to read a key as a stream, so rather than writing this logic again and again, wrap this up into a read stream so we simply point it to a key and it streams.

Other redis stream implementations use their own direct network connections to redis, but I would prefer to use an existing connection for all my redis work which makes authentication and things lke failover easier to deal with.

## Get involved

If you have input or ideas or would like to get involved, you may:

 - contact me via twitter @jeffbski  - <http://twitter.com/jeffbski>
 - open an issue on github to begin a discussion - <https://github.com/jeffbski/redis-rstream/issues>
 - fork the repo and send a pull request (ideally with tests) - <https://github.com/jeffbski/redis-rstream>

## License

 - [MIT license](http://github.com/jeffbski/redis-rstream/raw/master/LICENSE)

