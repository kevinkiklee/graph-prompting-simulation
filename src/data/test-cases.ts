import { TestCase } from '../types';

export const testCases: TestCase[] = [
  {
    id: 'sql-injection-01',
    description: 'Basic SQL injection vulnerability in a login query.',
    buggyCode: 'const query = "SELECT * FROM users WHERE username = \'" + username + "\' AND password = \'" + password + "\'";',
    expectedMatchRegex: /WHERE\s+username\s*=\s*\$[1-9]|WHERE\s+username\s*=\s*\?|Parameterized|query\(\s*["']SELECT.*WHERE.*username\s*=\s*\$1["']/i
  },
  {
    id: 'xss-01',
    description: 'Reflected XSS in a React component.',
    buggyCode: 'function Greeting({ name }) { return <div dangerouslySetInnerHTML={{ __html: name }} />; }',
    expectedMatchRegex: /<div>\s*\{\s*name\s*\}\s*<\/div>/
  },
  {
    id: 'logic-off-by-one',
    description: 'Off by one error in loop condition.',
    buggyCode: 'for (let i = 0; i <= array.length; i++) { sum += array[i]; }',
    expectedMatchRegex: /i\s*<\s*array\.length|let\s+i\s*=\s*0;\s*i\s*<\s*array\.length/
  },
  {
    id: 'race-condition-01',
    description: 'Asynchronous race condition without Promise.all.',
    buggyCode: 'async function processAll(items) { items.forEach(async (item) => { await process(item); }); }',
    expectedMatchRegex: /Promise\.all/
  },
  {
    id: 'auth-bypass-01',
    description: 'Hardcoded admin credentials.',
    buggyCode: 'if (user.username === "admin" && user.password === "admin123") { grantAdmin(); }',
    expectedMatchRegex: /bcrypt|hash|process\.env|environment variables/i
  },
  {
    id: 'unhandled-promise',
    description: 'Unhandled promise rejection in express route.',
    buggyCode: 'app.get("/data", (req, res) => { fetchFromDB().then(data => res.json(data)); });',
    expectedMatchRegex: /catch\(|try\s*\{/
  },
  {
    id: 'path-traversal-01',
    description: 'Path traversal vulnerability in file reader.',
    buggyCode: 'app.get("/file", (req, res) => { const file = fs.readFileSync("/var/www/uploads/" + req.query.filename); res.send(file); });',
    expectedMatchRegex: /path\.resolve|path\.basename|sanitize/i
  },
  {
    id: 'insecure-random',
    description: 'Using Math.random for crypto keys.',
    buggyCode: 'function generateSessionToken() { return Math.random().toString(36).substr(2); }',
    expectedMatchRegex: /crypto\.randomBytes|crypto\.getRandomValues/
  },
  {
    id: 'command-injection-01',
    description: 'Command injection via child_process.',
    buggyCode: 'exec("ls " + req.query.dir, (err, stdout) => { res.send(stdout); });',
    expectedMatchRegex: /execFile|spawn|sanitize/i
  },
  {
    id: 'memory-leak-01',
    description: 'Memory leak by adding to global array without clearing.',
    buggyCode: 'const cache = []; function cacheData(data) { cache.push(data); }',
    expectedMatchRegex: /WeakMap|Map|LRU|cache\.length\s*>\s*MAX/i
  }
];
