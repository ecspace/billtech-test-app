import config from './config.js';

const cache = new Map();

export default {
  get(id) {
    const entry = cache.get(id);
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.timestamp > config.ttl) {
      cache.delete(id);
      return null;
    }
    return entry.value;
  },
  set(id, value) {
    cache.set(id, { value, timestamp: Date.now() });
  }
};
