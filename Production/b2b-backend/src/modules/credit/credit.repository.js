import Credit from './credit.model.js';
import CreditLedger from './credit.ledger.js';

export const findByUser = (userId) =>
  Credit.findOne({ userId });

export const createCredit = (data) =>
  Credit.create(data);

export const updateCredit = (userId, data, options = {}) =>
  Credit.findOneAndUpdate({ userId }, data, { new: true, ...options });

export const addLedger = (data, options = {}) =>
  CreditLedger.create([data], options.session ? { session: options.session } : undefined).then(
    (result) => (Array.isArray(result) ? result[0] : result)
  );

export const getLedger = (userId) =>
  CreditLedger.find({ userId }).sort({ createdAt: -1 });