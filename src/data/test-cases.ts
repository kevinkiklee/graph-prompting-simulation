import { TestCase } from '../types';

export const testCases: TestCase[] = [
  {
    id: 'concurrent-task-scheduler',
    description: 'Implement a task scheduler `runTasks(tasks, concurrency)`. It must run up to `concurrency` async tasks simultaneously. It MUST return results in the exact original order. It MUST handle promise rejections by returning the Error object in the results array instead of throwing. You MUST use a `Set` to track currently running promises.',
    buggyCode: `
async function runTasks(tasks, concurrency) {
  const results = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}
    `.trim(),
    expectedMatchRegex: /Set[\s\S]*catch|catch[\s\S]*Set/i
  },
  {
    id: 'secure-deep-merge',
    description: 'Implement `deepMerge(target, source)`. It MUST prevent Prototype Pollution by strictly blocking keys "__proto__", "constructor", and "prototype". It MUST handle circular references using a `WeakMap`. It MUST NOT mutate the input objects (return a newly created object).',
    buggyCode: `
function deepMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = target[key] || {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
    `.trim(),
    expectedMatchRegex: /WeakMap[\s\S]*__proto__|__proto__[\s\S]*WeakMap/i
  },
  {
    id: 'crypto-token-gen',
    description: 'Create `generateToken()`. It MUST use `crypto.randomBytes`. It MUST return a hex string exactly 64 characters long (requires 32 bytes). It MUST be asynchronous by wrapping the callback version of `crypto.randomBytes` in a Promise. Do NOT use the synchronous `crypto.randomBytesSync`.',
    buggyCode: `
const crypto = require('crypto');
function generateToken() {
  return crypto.randomBytes(32).toString('hex'); // Synchronous and blocks event loop!
}
    `.trim(),
    expectedMatchRegex: /new Promise[\s\S]*randomBytes|randomBytes[\s\S]*new Promise/i
  },
  {
    id: 'lru-cache-optimal',
    description: 'Implement an LRU Cache class `LRUCache` with `get(key)` and `set(key, value)`. It MUST use an ES6 `Map` to achieve O(1) time complexity and rely on Map\'s native insertion order tracking. When capacity is exceeded, it MUST delete the oldest item using exactly `this.cache.keys().next().value` (assuming your Map is named cache).',
    buggyCode: `
class LRUCache {
  constructor(capacity) { this.capacity = capacity; this.cache = {}; this.order = []; }
  get(key) {
    if (!this.cache[key]) return -1;
    this.order = this.order.filter(k => k !== key);
    this.order.push(key);
    return this.cache[key];
  }
  set(key, value) {
    if (this.order.length >= this.capacity) {
      const oldest = this.order.shift();
      delete this.cache[oldest];
    }
    this.cache[key] = value;
    this.order.push(key);
  }
}
    `.trim(),
    expectedMatchRegex: /\.keys\(\)\.next\(\)\.value/
  },
  {
    id: 'state-machine-parser',
    description: 'Fix this state machine parser `parseCommands(str)`. State starts at 0. \'A\' adds 1, \'B\' multiplies by 2, \'C\' subtracts 1. It MUST process the string in a single pass using `Array.prototype.reduce`. It MUST throw a `TypeError` immediately if an invalid character is encountered.',
    buggyCode: `
function parseCommands(str) {
  let state = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === 'A') state += 1;
    if (str[i] === 'B') state *= 2;
    if (str[i] === 'C') state -= 1;
  }
  return state;
}
    `.trim(),
    expectedMatchRegex: /\.reduce\([\s\S]*TypeError|TypeError[\s\S]*\.reduce\(/i
  }
];
