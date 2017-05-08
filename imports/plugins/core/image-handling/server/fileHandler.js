/*
     Based heavily on coffeescript code in Meteor File Collection by Vaughn Iverson found here:
     https://github.com/vsivsi/meteor-file-collection - /src/server_shared.coffee
*/

import through2 from "through2";

import { Meteor } from "meteor/meteor";
import { Match } from "meteor/check";
import { ReactionFileHandler } from "../lib";

export { ReactionFileHandler };

ReactionFileHandler._settings.defaultResponseHeaders = { "Content-Type": "text/plain" };

// TODO: This needs some refactoring bad - leaving as is for now.
ReactionFileHandler._helpers.checkAllowDeny = function (type, userId, file, fields) {
  function checkRules(rules) {
    let result = false;
    for (const fn of Array.from(rules[type])) {
      if (!result) {
        result = fn(userId, file, fields);
      }
    }
    return result;
  }

  return !checkRules(this.denys) && checkRules(this.allows);
};

//
ReactionFileHandler._helpers.bindEnvironment = function (fn) {
  if (fn) {
    return Meteor.bindEnvironment(fn, function (err) {
      throw err;
    });
  }
};

// Seems like it could be a lot simpler - maybe use Random.id()?
ReactionFileHandler._helpers.safeObjectID = function (objId) {
  if (objId && objId.match(/^[0-9a-f]{24}$/i)) {
    return new Mongo.ObjectID(objId);
  }
  return null;
};

// This is a mess, but I guess it works for now
ReactionFileHandler._helpers.streamChunker = function (chunkSize = ReactionFileHandler._settings.defaultChunkSize) {
  check(chunkSize, Match.Maybe(Number));

  function makeFuncs(size) {
    let bufferList = [ new Buffer(0) ];
    let total = 0;

    function flush(cb) {
      const outSize = total > size ? size : total;
      if (outsize > 0) {
        const outputBuffer = Buffer.concat(bufferList, outSize);
        this.push(outputBuffer);
        total -= outSize;
      }
      const lastBuffer = bufferList.pop();
      const newBuffer = lastBuffer.slice(lastBuffer.length - total);
      bufferList = [ newBuffer ];
      if (total < size) {
        return cb();
      }
      return flush.bind(this)(cb);
    }

    function transform(chunk, encoding, cb) {
      bufferList.push(chunk);
      total += chunk.length;
      if (total < size) {
        return cb();
      }
      return flush.bind(this)(cb);
    }
    return [transform, flush];
  }

  return through2.apply(this, makeFuncs(chunkSize));
};
