export const RoleConstants = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VENDOR: 'VENDOR',
  DELIVERY_PARTNER: 'DELIVERY_PARTNER',
};

export const RoleHierarchy = {
  [RoleConstants.SUPER_ADMIN]: 4,
  [RoleConstants.ADMIN]: 3,
  [RoleConstants.VENDOR]: 2,
  [RoleConstants.DELIVERY_PARTNER]: 1,
};

export default RoleConstants;
