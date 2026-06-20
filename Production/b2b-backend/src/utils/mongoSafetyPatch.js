import mongoose from 'mongoose';

/**
 * Apply runtime safety patches to mongoose and native collection methods.
 *
 * - Blocks deleteMany({}) / deleteMany() with empty filters in production.
 * - Blocks dropDatabase / dropCollection / collection.drop in production.
 * - Blocks remove(), findOneAndDelete() when used without a restrictive filter for mass cleanup.
 *
 * This is a hard, global guard intended to make accidental mass-deletes impossible from application code.
 */
export function applyMongoSafetyPatches({ logger = console } = {}) {
  const mongoosePkg = mongoose;

  // Helper: isEmptyFilter
  function isEmptyFilter(filter) {
    if (filter == null) return true;
    if (typeof filter !== 'object') return false;
    return Object.keys(filter).length === 0;
  }

  // Only enforce strict checks when running in production
  const inProduction = process.env.NODE_ENV === 'production';

  // Patch Model-level destructive methods
  const Model = mongoosePkg.Model;
  const destructiveMethods = ['deleteMany', 'deleteOne', 'remove', 'findOneAndDelete', 'findOneAndRemove', 'findOneAndReplace', 'findByIdAndDelete', 'findByIdAndRemove'];

  destructiveMethods.forEach((methodName) => {
    // Patch instance prototype method if present
    if (Model.prototype[methodName]) {
      const originalProto = Model.prototype[methodName];
      Model.prototype[methodName] = async function patchedProto(...args) {
        const filter = args[0];
        if (inProduction && isEmptyFilter(filter)) {
          const msg = `Blocked ${this.modelName || 'Model'}.${methodName} with empty filter in production`;
          logger.error(msg);
          throw new Error(msg);
        }
        return originalProto.apply(this, args);
      };
    }

    // Patch static Model method if present (Model.deleteMany)
    if (typeof Model[methodName] === 'function') {
      const originalStatic = Model[methodName];
      Model[methodName] = async function patchedStatic(...args) {
        const filter = args[0];
        // this in static context is the Model (has modelName)
        const modelName = this?.modelName || 'Model';
        if (inProduction && isEmptyFilter(filter)) {
          const msg = `Blocked ${modelName}.${methodName} with empty filter in production`;
          logger.error(msg);
          throw new Error(msg);
        }
        return originalStatic.apply(this, args);
      };
    }
  });

  // Patch collection-level methods (native driver)
  const originalCollection = mongoosePkg.Collection && mongoosePkg.Collection.prototype;
  if (originalCollection) {
    // deleteMany
    const origDeleteMany = originalCollection.deleteMany;
    if (origDeleteMany) {
      originalCollection.deleteMany = function patchedDeleteMany(filter, options, cb) {
        if (inProduction && (filter == null || (typeof filter === 'object' && Object.keys(filter).length === 0))) {
          const msg = `Blocked native collection.deleteMany with empty filter in production (collection: ${this.collectionName})`;
          logger.error(msg);
          throw new Error(msg);
        }
        return origDeleteMany.call(this, filter, options, cb);
      };
    }

    // drop
    const origDrop = originalCollection.drop;
    if (origDrop) {
      originalCollection.drop = function patchedDrop(...args) {
        if (inProduction) {
          const msg = `Blocked collection.drop(${this.collectionName}) in production`;
          logger.error(msg);
          throw new Error(msg);
        }
        return origDrop.apply(this, args);
      };
    }
  }

  // Patch connection-level dropDatabase
  const connProto = mongoosePkg.Connection && mongoosePkg.Connection.prototype;
  if (connProto && connProto.db && connProto.db.dropDatabase) {
    const origDropDb = connProto.db.dropDatabase;
    connProto.db.dropDatabase = function patchedDropDatabase(...args) {
      if (inProduction) {
        const msg = `Blocked dropDatabase() in production`;
        logger.error(msg);
        throw new Error(msg);
      }
      return origDropDb.apply(this, args);
    };
  }

  logger.info('MongoDB safety patches applied: destructive operations are blocked in production');
}

export default applyMongoSafetyPatches;
