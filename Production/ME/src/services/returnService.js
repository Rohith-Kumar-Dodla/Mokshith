import api from './api';
const unwrap = response => response?.data?.data ?? response?.data ?? response;
const command = async (id, action, data = {}) => unwrap(await api.post(`/returns/${id}/${action}`, data));
export default {
  list: async params => unwrap(await api.get('/returns', { params })),
  get: async id => unwrap(await api.get(`/returns/${id}`)),
  create: async data => unwrap(await api.post('/returns', data, { headers: { 'Idempotency-Key': data.idempotencyKey } })),
  cancel: async id => command(id, 'cancel'), approve: async id => command(id, 'approve'),
  reject: async (id, note) => command(id, 'reject', { note }), receive: async (id, data) => command(id, 'receive', data),
  inspect: async (id, data) => command(id, 'inspect', data), refund: async id => command(id, 'refund'), replacement: async id => command(id, 'replacement'),
};
