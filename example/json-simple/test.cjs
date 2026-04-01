const { createRequire } = require('module');
const cwd = process.cwd();
const req = createRequire(cwd + '/package.json');
try {
  console.log('Result:', req.resolve('@json-express/middleware-auth'));
} catch (e) {
  console.error('Error:', e.message);
}
