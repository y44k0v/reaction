/*
     Based heavily on coffeescript code in Meteor File Collection by Vaughn Iverson found here:
     https://github.com/vsivsi/meteor-file-collection - /src/gridFS_client.coffee
*/
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";

// import { Logger } from "/client/api";

export class FileCollection extends Mongo.Collection {
  constructor(root = share.defaultRoot, options = {}) {
    super(root + ".files", { idGeneration: "MONGO" });
    let optionsObj = options || {};
    this.root = root;

    if (!(this instanceof FileCollection)) {
      return new FileCollection(root, options);
    }

    if (!(this instanceof Mongo.Collection)) {
      throw new Meteor.Error("The global definition of Mongo.Collection has changed since the file-collection package was loaded." +
        "Please ensure that any packages that redefine Mongo.Collection are loaded before file-collection.");
    }

    if (Mongo.Collection !== Mongo.Collection.prototype.constructor) {
      throw new Meteor.Error("The global definition of Mongo.Collection has been patched by another package, " +
        "and the prototype constructor has been left in an inconsistent state. " +
        "Please see this link for a workaround: https://github.com/vsivsi/meteor-file-sample-app/issues/2#issuecomment-120780592");
    }

    if (typeof this.root === "object") {
      optionsObj = this.root;
      this.root = share.defaultRoot;
    }

    this.base = this.root;
    this.baseURL = optionsObj.baseURL || `/gridfs/${this.root}`;
    this.chunkSize = optionsObj.chunkSize || share.defaultChunkSize;

     // This call sets up the optional support for resumable.js
     // See the resumable.coffee file for more information
    if (optionsObj.resumable) {
      share.setup_resumable.bind(this)();
    }
  }

  // remove works as-is. No modifications necessary so it currently goes straight to super

  // Insert only creates an empty (but valid) gridFS file. To put data into it from a client,
  // you need to use an HTTP POST or PUT after the record is inserted. For security reasons,
  // you shouldn't be able to POST or PUT to a file that hasn't been inserted.

  insert(file, callback) {
    // This call ensures that a full gridFS file document
    // gets built from whatever is provided
    let callbackFunction = callback;
    if (callbackFunction === null) {
      callbackFunction = undefined;
    }

    const chunkFile = share.insert_func(file, this.chunkSize);
    return super.insert(chunkFile, callback);
  }

  // This will only update the local client-side minimongo collection
  // You can shadow update with this to enable latency compensation when
  // updating the server-side collection using a Meteor method call
  localUpdate(selector, modifier, options, callback) {
    let err;
    let optionsObj = options || {};
    let callbackFunction = callback || undefined;
    if (!callback && (typeof options === "function")) {
      callbackFunction = options;
      optionsObj = {};
    }

    if (optionsObj.upsert) {
      err = new Meteor.Error("Update does not support the upsert option");
      if (callbackFunction) {
        return callbackFunction(err);
      }
      throw err;
    }

    if (share.reject_file_modifier(modifier)) {
      err = new Meteor.Error("Modifying gridFS read-only document elements is a very bad idea!");
      if (callbackFunction) {
        return callback(err);
      }
      throw err;
    } else {
      return this.find().collection.update(selector, modifier, options, callback);
    }
  }

  allow() {
    throw new Meteor.Error("File Collection Allow rules may not be set in client code.");
  }

  deny() {
    throw new Meteor.Error("File Collection Deny rules may not be set in client code.");
  }

  upsert() {
    throw new Meteor.Error("File Collections do not support 'upsert'");
  }

  update() {
    throw new Meteor.Error("File Collections do not support 'update' on client, use method calls instead");
  }

  findOneStream() {
    throw new Meteor.Error("File Collections do not support 'findOneStream' in client code.");
  }

  upsertStream() {
    throw new Meteor.Error("File Collections do not support 'upsertStream' in client code.");
  }

  importFile() {
    throw new Meteor.Error("File Collections do not support 'importFile' in client code.");
  }

  exportFile() {
    throw new Meteor.Error("File Collections do not support 'exportFile' in client code.");
  }
}
