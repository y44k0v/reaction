/*
     Based heavily on coffeescript code in Meteor File Collection by Vaughn Iverson found here:
     https://github.com/vsivsi/meteor-file-collection - /src/gridFS.coffee
*/

import { Match } from "meteor/check";
import { Mongo } from "meteor/mongo";
export const ReactionFileHandler = {
  _settings: {},
  _helpers: {}
};

ReactionFileHandler._settings.defaultChunkSize = (2 * 1024 * 1024) - 1024;
ReactionFileHandler._settings.defaultRoot = "fs";

ReactionFileHandler._settings.resumableBase = "/_resumable";

ReactionFileHandler._helpers.insertFunc = function (file, chunkSize) {
  let id;
  let fileObj = file;
  if (!file) {
    fileObj = {};
  }
  try {
    id = new Mongo.ObjectID(`${fileObj._id}`);
  } catch (error) {
    id = new Mongo.ObjectID();
  }

  const fileToInsert = {};
  fileToInsert._id = id;
  fileToInsert.length = 0;
  fileToInsert.md5 = "d41d8cd98f00b204e9800998ecf8427e";
  fileToInsert.uploadDate = new Date();
  fileToInsert.chunkSize = chunkSize;
  fileToInsert.filename = fileObj.filename || "";
  fileToInsert.metadata = fileObj.metadata || {};
  fileToInsert.aliases = fileObj.aliases || [];
  fileToInsert.contentType = fileObj.contentType || "application/octet-stream";

  return fileToInsert;
};

ReactionFileHandler._helpers.rejectFileModifier = function (modifier) {
  const forbiddenAttributes = Match.OneOf(
    Match.ObjectIncluding({ _id: Match.Any }),
    Match.ObjectIncluding({ length: Match.Any }),
    Match.ObjectIncluding({ chunkSize: Match.Any }),
    Match.ObjectIncluding({ md5: Match.Any }),
    Match.ObjectIncluding({ uploadDate: Match.Any }));

  const requiredAttributes = Match.OneOf(
    Match.ObjectIncluding({ _id: Match.Any }),
    Match.ObjectIncluding({ length: Match.Any }),
    Match.ObjectIncluding({ chunkSize: Match.Any }),
    Match.ObjectIncluding({ md5: Match.Any }),
    Match.ObjectIncluding({ uploadDate: Match.Any }),
    Match.ObjectIncluding({ metadata: Match.Any }),
    Match.ObjectIncluding({ aliases: Match.Any }),
    Match.ObjectIncluding({ filename: Match.Any }),
    Match.ObjectIncluding({ contentType: Match.Any })
   );

  return Match.test(modifier, Match.OneOf(
    Match.ObjectIncluding({ $set: forbiddenAttributes }),
    Match.ObjectIncluding({ $unset: requiredAttributes }),
    Match.ObjectIncluding({ $inc: forbiddenAttributes }),
    Match.ObjectIncluding({ $mul: forbiddenAttributes }),
    Match.ObjectIncluding({ $bit: forbiddenAttributes }),
    Match.ObjectIncluding({ $min: forbiddenAttributes }),
    Match.ObjectIncluding({ $max: forbiddenAttributes }),
    Match.ObjectIncluding({ $rename: requiredAttributes }),
    Match.ObjectIncluding({ $currentDate: forbiddenAttributes }),
    Match.Where(pat => // This requires that the update isn't a replacement
      !Match.test(pat, Match.OneOf(
        Match.ObjectIncluding({ $inc: Match.Any }),
        Match.ObjectIncluding({ $set: Match.Any }),
        Match.ObjectIncluding({ $unset: Match.Any }),
        Match.ObjectIncluding({ $addToSet: Match.Any }),
        Match.ObjectIncluding({ $pop: Match.Any }),
        Match.ObjectIncluding({ $pullAll: Match.Any }),
        Match.ObjectIncluding({ $pull: Match.Any }),
        Match.ObjectIncluding({ $pushAll: Match.Any }),
        Match.ObjectIncluding({ $push: Match.Any }),
        Match.ObjectIncluding({ $bit: Match.Any })
      )
    ))
  ));
};
