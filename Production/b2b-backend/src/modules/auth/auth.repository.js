import User from '../user/user.model.js';
import { normalizeLoginIdentifier } from '../../utils/loginIdentifier.js';

export const findUserByEmailOrMobile = async (identifier) => {
  const { email, mobile, raw } = normalizeLoginIdentifier(identifier);

  const orConditions = [];
  if (email) {
    orConditions.push({ email });
  }
  if (mobile) {
    orConditions.push({ mobile }, { phone: mobile });
  }
  if (raw && raw !== email && raw !== mobile) {
    orConditions.push({ email: raw.toLowerCase() }, { mobile: raw }, { phone: raw });
  }

  if (orConditions.length === 0) {
    return null;
  }

  return User.findOne({ $or: orConditions }).select('+password +refreshToken');
};

export const findUserByMobile = async (mobile) => {
  const { mobile: normalizedMobile } = normalizeLoginIdentifier(mobile);
  if (!normalizedMobile) {
    return null;
  }

  return User.findOne({
    $or: [{ mobile: normalizedMobile }, { phone: normalizedMobile }],
  }).select('+password +refreshToken');
};

export const findUserById = async (id) => {
  return User.findById(id);
};

/** Includes password + history for credential verification flows. */
export const findUserByIdWithPassword = async (id) => {
  return User.findById(id).select('+password +passwordHistory');
};

export const createUser = async (data) => {
  return User.create(data);
};

export const updateUser = async (id, data) => {
  return User.findByIdAndUpdate(id, data, { new: true });
};
