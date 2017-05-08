/*
     Based heavily on coffeescript code in Meteor File Collection by Vaughn Iverson found here:
     https://github.com/vsivsi/meteor-file-collection - /src/gridFS_server.coffee
*/

import fs from "fs";
import path from "path";
import mongodb from "mongodb";
import grid from "gridfs-locking-stream";
import gridLocks from "gridfs-locks";

import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { Match } from "meteor/match";

import { Logger } from "/server/api";

import { ReactionFileHandler } from "./fileHandler";

export class ReactionFileCollection extends Mongo.Collection {
  constructor(root = ReactionFileHandler.settings.defaultRoot, options = {}) {
    super(root + ".files", { idGeneration: "MONGO" });

    this.root = root;
    let optionsObj;
    if (!(this instanceof FileCollection)) {
      return new FileCollection(root, options);
    }

    if (!(this instanceof Mongo.Collection)) {
      throw new Meteor.Error("The global definition of Mongo.Collection has changed since the file-collection package was loaded." +
        " Please ensure that any packages that redefine Mongo.Collection are loaded before file-collection.");
    }

    if (Mongo.Collection !== Mongo.Collection.prototype.constructor) {
      throw new Meteor.Error("The global definition of Mongo.Collection has been patched by another package," +
        " and the prototype constructor has been left in an inconsistent state. Please see this link for a workaround: " +
        "https://github.com/vsivsi/meteor-file-sample-app/issues/2#issuecomment-120780592");
    }

    if (typeof this.root === "object") {
      optionsObj = this.root;
      this.root = ReactionFileHandler._settings.defaultRoot;
    }

    this.chunkSize = optionsObj.chunkSize || ReactionFileHandler._settings.defaultChunkSize;
    this.db = Meteor.wrapAsync(mongodb.MongoClient.connect)(process.env.MONGO_URL, {});

    // Is optionsObj.locks.timeout set? Otherwise use default
    this.lockOptions = {
      timeOut: 360,
      lockExpiration: 90,
      pollingInterval: 5
    };

    if (optionsObj.locks) {
      if (optionsObj.locks.timeOut) {
        this.lockOptions.timeout = optionsObj.locks.timeOut;
      }
      if (optionsObj.locks.lockExpiration) {
        this.lockOptions.lockExpiration = optionsObj.locks.lockExpiration;
      }
      if (optionsObj.locks.pollingInterval) {
        this.lockOptions.pollingInterval = optionsObj.locks.pollingInterval;
      }
    }

    this.locks = gridLocks.LockCollection(this.db, {}.extends(
      { root: this.root },
      this.lockOptions
    ));

    this.gfs = new grid(this.db, mongodb, this.root);

    this.baseURL = optionsObj.baseURL || `/gridfs/${this.root}`;

    // if there are HTTP optionsObj, setup the express HTTP access point(s)
    // resumable and http are turned off for now
    // if (optionsObj.resumable || optionsObj.http) {
    //   ReactionFileHandler._settings.setupHttpAccess.bind(this)(optionsObj);
    // }

    // Default client allow/deny permissions
    this.allows = { read: [], insert: [], write: [], remove: [] };
    this.denys = { read: [], insert: [], write: [], remove: [] };

    // SUPER WAS HERE: super @root + '.files', { idGeneration: 'MONGO' }

    // Default indexes
    if (optionsObj.resumable) {
      const indexOptions = {};
      if (typeof optionsObj.resumableIndexName === "string") {
        indexOptions.name = optionsObj.resumableIndexName;
      }

      this.db.collection(`${this.root}.files`).ensureIndex({
        "metadata._Resumable.resumableIdentifier": 1,
        "metadata._Resumable.resumableChunkNumber": 1,
        "length": 1
      }, indexOptions);
    }
    // Negative is no limit...
    this.maxUploadSize = -1;
    if (optionsObj.maxUploadSize) {
      this.maxUploadSize = optionsObj.maxUploadSize;
    }

    //  Setup specific allow/deny rules for gridFS, and tie-in the application settings
    FileCollection.__super__.allow.bind(this)({
      // Because allow rules are not guaranteed to run,
      // all checking is done in the deny rules below
      insert: () => true,
      remove: () => true
    });

    FileCollection.__super__.deny.bind(this)({
      insert: (userId, file) => {
        // Make darn sure we're creating a valid gridFS .files document
        check(file, {
          _id: Mongo.ObjectID,
          length: Match.Where(fileLength => {
            check(fileLength, Match.Integer);
            return fileLength === 0;
          }),
          md5: Match.Where(fileMd5 => {
            check(fileMd5, String);
            return fileMd5 === "d41d8cd98f00b204e9800998ecf8427e"; // The md5 of an empty file
          }),
          uploadDate: Date,
          chunkSize: Match.Where(fileChunkSize => {
            check(fileChunkSize, Match.Integer);
            return fileChunkSize === this.chunkSize;
          }),
          filename: String,
          contentType: String,
          aliases: [ String ],
          metadata: Object
        });

        // Enforce a uniform chunkSize
        if (file.chunkSize !== this.chunkSize) {
          Logger.warn("Invalid chunksize");
          return true;
        }

        // call application rules
        if (ReactionFileHandler._helpers.checkAllowDeny.bind(this)("insert", userId, file)) {
          return false;
        }

        return true;
      },

      update: () => {
        // fields: (userId, file, fields)
        // Cowboy updates are not currently allowed from the client. Too much to screw up.
        // For example, if you store file ownership info in a sub document under 'metadata'
        // it will be complicated to guard against that being changed if you allow other parts
        // of the metadata sub doc to be updated. Write specific Meteor methods instead to
        // allow reasonable changes to the "metadata" parts of the gridFS file record.
        return true;
      },

      remove: () => {
        // userId, file
        // Remove is now handled via the default method override below, so this should
        // never be called.
        return true;
      }
    });

    const self = this; // necessary in the method definition below

    Meteor.server.method_handlers[`${this._prefix}remove`] = function (selector) {
      check(selector, Object);

      if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) {
        throw new Meteor.Error(403, "Not permitted. Untrusted code may only remove documents by ID.");
      }

      cursor = self.find(selector);

      if (cursor.count() > 1) {
        throw new Meteor.Error(500,
          "Remote remove selector targets multiple files." + "\n" +
          "See https://github.com/vsivsi/meteor-file-collection/issues/152#issuecomment-278824127");
      }

      const [file] = cursor.fetch(); // Destructure found result array;

      if (file) {
        if (ReactionFileHandler._helpers.checkAllowDeny.bind(self)("remove", this.userId, file)) {
          return self.remove(file);
        }
        throw new Meteor.Error(403, "Access denied");
      } else {
        return 0;
      }
    };
  }

  // Register application allow rules
  allow(allowOptions) {
    const self = this;
    for (const type in allowOptions) {
      if ({}.hasOwnProperty(allowOptions, type)) {
        const func = allowOptions[type];
        if (!(type in self.allows)) {
          throw new Meteor.Error(`Unrecognized allow rule type '${type}'.`);
        }
        if (typeof func !== "function") {
          throw new Meteor.Error(`Allow rule ${type} must be a valid function.`);
        }
        self.allows[type].push(func);
      }
    }
  }

  // Register application deny rules
  deny(denyOptions) {
    const self = this;
    for (const type in denyOptions) {
      if ({}.hasOwnProperty(denyOptions, type)) {
        const func = denyOptions[type];
        if (!(type in self.denys)) {
          throw new Meteor.Error(`Unrecognized deny rule type '${type}'.`);
        }
        if (typeof func !== "function") {
          throw new Meteor.Error(`Deny rule ${type} must be a valid function.`);
        }
        self.denys[type].push(func);
      }
    }
  }

  // Register application insert rules
  insert(file = {}, callback = undefined) {
    const superFile = ReactionFileHandler._helpers.insertFunc(file, this.chunkSize);
    super(superFile, callback);
  }

  // Update is dangerous! The checks inside attempt to keep you out of
  // trouble with gridFS. Clients can't update at all. Be careful!
  // Only metadata, filename, aliases and contentType should ever be changed
  // directly by a server.
  update(selector, modifier, options = {}, callback = undefined) {
    let callbackFunction = callback;
    let optionsObj = options;

    super(selector, modifier, optionsObj, callbackFunction);

    if (!callback && typeof options === "function") {
      callbackFunction = options;
      optionsObj = {};
    }

    if (options.upsert) {
      const err = new Meteor.Error("Update does not support the upsert option");
      if (callbackFunction) {
        return (callbackFunction, err);
      }
      throw err;
    }

    if (ReactionFileHandler._helpers.ejectFileModifier(modifier) && !optionsObj.force) {
      const err = new Meteor.Error("Modifying gridFS read-only document elements is a very bad idea!");
      if (callbackFunction) {
        return (callbackFunction, err);
      }
      throw err;
    }
  }

  upsert(selector, modifier, options = {}, callback = undefined) {
    let callbackFunction = callback;

    if (!callback && typeof options === "function") {
      callbackFunction = options;
    }

    err = new Meteor.Error("File Collections do not support 'upsert'");

    if (callbackFunction) {
      return (callbackFunction, err);
    }
    throw err;
  }

  upsertStream(file, options = {}, callback = undefined) {
    const mods = { ...file };
    const mutableFile = { ...file };
    let callbackFunction = callback;
    let optionsObj = options;
    let found;

    if (!callback && typeof options === "function") {
      callbackFunction = options;
      optionsObj = {};
    }
    callbackFunction = ReactionFileHandler._helpers.bindEnvironment(callbackFunction);

    if (!obtionsObj.autoRenewLock) {
      optionsObj.autoRenewLock = true;
    }

    if (options.mode === "w+") {
      throw new Meteor.Error("The ability to append file data in upsertStream() was removed");
    }

    if (mutableFile._id) {
      found = this.findOne({ _id: mutableFile._id });
    }

    if (!(mutableFile._id && found)) {
      // Insert file and store resulting _id
      mutableFile._id = this.insert(mods);
    } else if (Object.keys(mods).length > 0) {
      this.update({ _id: mutableFile._id }, { $set: mods });
    }

    const writeStream = Meteor.wrapAsync(this.gfs.createWriteStream.bind(this.gfs))({
      root: this.root,
      _id: mongodb.ObjectID(`${mutableFile._id}`),
      mode: "w",
      timeOut: this.lockOptions.timeOut,
      lockExpiration: this.lockOptions.lockExpiration,
      pollingInterval: this.lockOptions.pollingInterval
    });

    if (writeStream) {
      if (optionsObj.autoRenewLock) {
        writeStream.on("expires-soon", () => {
          writeStream.renewLock(function (e, d) {
            if (e || !d) {
              Logger.warn(`Automatic Write Lock Renewal Failed ${mutableFile._id}`, e);
            }
          });
        });
      }

      if (callbackFunction) {
        writeStream.on("close", function (returnFile) {
          if (returnFile) {
            returnFile._id = new Mongo.ObjectID(returnFile._id.toHexString());
            callbackFunction(null, returnFile);
          }
        });

        writeStream.on("error", function (err) {
          callbackFunction(err);
        });
      }

      return writeStream;
    }

    return null;
  }

  findOneStream(selector, options = {}, callback = undefined) {
    let callbackFunction = callback;
    let optionsObj = options;

    if (!callback && typeof options === "function") {
      callbackFunction = options;
      optionsObj = {};
    }
    const opts = {};

    if (optionsObj.sort) {
      opts.sort = optionsObj.sort;
    }

    if (optionsObj.skip) {
      opts.skip = optionsObj.skip;
    }
    const file = this.findOne(selector, opts);

    if (file) {
      if (!optionsObj.autoRenewLock) {
        optionsObj.autoRenewLock = true;
      }

      // Init the start and end range, default to full file or start/end as specified
      range = {};
      if (options.range) {
        range.startPos = options.range.start || 0;
        range.endPos = options.range.end || file.length - 1;
      } else {
        range.startPos = 0;
        range.endPos = file.length - 1;
      }

      readStream = Meteor.wrapAsync(this.gfs.createReadStream.bind(this.gfs))({
        root: this.root,
        _id: mongodb.ObjectID(`${file._id}`),
        timeOut: this.lockOptions.timeOut,
        lockExpiration: this.lockOptions.lockExpiration,
        pollingInterval: this.lockOptions.pollingInterval,
        range
      });

      if (readStream) {
        if (options.autoRenewLock) {
          readStream.on("expires-soon", () => {
            readStream.renewLock(function (e, d) {
              if (e || !d) {
                Logger.warn(`Automatic Read Lock Renewal Failed: ${file._id}`, e);
              }
            });
          });
        }

        if (callbackFunction) {
          readStream.on("close", function () {
            callbackFunction(null, file);
          });
          readStream.on("error", function (err) {
            callbackFunction(err);
          });
        }
        return readStream;
      }
    }
    return null;
  }

  remove(selector, callback = undefined) {
    const callbackFunction = ReactionFileHandler._helpers.bindEnvironment(callback);

    if (selector) {
      let ret = 0;
      this.find(selector).forEach(function (file) {
        const res = Meteor.wrapAsync(this.gfs.remove.ind(this.gfs))({
          _id: mongodb.ObjectID(`${file._id}`),
          root: this.root,
          timeOut: this.lockOptions.timeOut,
          lockExpiration: this.lockOptions.lockExpiration,
          pollingInterval: this.lockOptions.pollingInterval
        });
        if (res) {
          ret += 1;
        }
      });
      if (callbackFunction) {
        callbackFunction(null, ret);
      }
      return ret;
    }
    const err = new Meteor.Error("Remove with an empty selector is not supported");
    if (callbackFunction) {
      return callbackFunction(err);
    }
    throw err;
  }

  importFile(filePath, file, callback) {
    const callbackFunction = ReactionFileHandler._helpers.bindEnvironment(callback);
    const normalFilePath = path.normalize(filePath);
    const fileObj = file || {};

    fileObj.filename = fileObj.filename || path.basename(normalFilePath);
    const writeStream = this.upsertStream(fileObj);
    const readStream = fs.createReadStream(normalFilePath);
    readStream.on("error", ReactionFileHandler._helpers.bindEnvironment(callbackFunction));
    readStream
      .pipe(ReactionFileHandler._helpers.streamChunker(this.chunkSize))
      .pipe(writeStream)
      .on("close", ReactionFileHandler._helpers.bindEnvironment(function (d) {
        callbackFunction(null, d);
      }))
      .on("error", ReactionFileHandler._helpers.bindEnvironment(callbackFunction));
  }

  exportFile(selector, filepath, callback) {
    const callbackFunction = ReactionFileHandler.settings.bind_env(callback);
    const normalFilePath = path.normalize(filePath);
    const writeStream = fs.createWriteStream(normalFilePath);
    const readStream = this.findOneStream(selector);
    readStream.pipe(writeStream)
      .on("finish", ReactionFileHandler._helpers.bindEnvironment(callbackFunction))
      .on("error", ReactionFileHandler._helpers.bindEnvironment(callbackFunction));
  }
}
