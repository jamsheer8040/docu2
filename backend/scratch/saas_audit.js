const fs = require('fs');
const path = require('path');

const controllerDir = path.join(__dirname, '../controllers');
const files = fs.readdirSync(controllerDir).filter(f => f.endsWith('.js'));

let violations = [];

for (const file of files) {
  const filePath = path.join(controllerDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Bad Create: .create(req.body)
    if (/\.create\(\s*req\.body\s*\)/.test(line) || /\.bulkCreate\(\s*req\.body\s*\)/.test(line)) {
      violations.push({ file, line: i + 1, type: 'Bad Create', content: line.trim() });
    }

    // 2. Bad Update: .update(req.body
    if (/\.update\(\s*req\.body\s*,/.test(line)) {
      violations.push({ file, line: i + 1, type: 'Bad Update (req.body)', content: line.trim() });
    }

    // 3. Bad Destroy: model.destroy({ where: { id: req.params.id } }) without tenant_id
    if (/\.destroy\(\s*\{\s*where\s*:\s*\{[^}]*id\s*:\s*[^,}]+\s*\}\s*\}\s*\)/.test(line) && !line.includes('tenant_id')) {
      // It's possible tenant_id is on a previous line, but this is a simple check
      if (!content.substring(Math.max(0, content.indexOf(line) - 100), content.indexOf(line) + 100).includes('tenant_id')) {
         violations.push({ file, line: i + 1, type: 'Bad Destroy (missing tenant_id)', content: line.trim() });
      }
    }
    
    // 4. Bad Find: model.findOne({ where: { id: req.params.id } }) without tenant_id
    if (/\.find(One|All)\(\s*\{\s*where\s*:\s*\{[^}]*id\s*:\s*[^,}]+\s*\}\s*\}\s*\)/.test(line) && !line.includes('tenant_id')) {
      if (!content.substring(Math.max(0, content.indexOf(line) - 100), content.indexOf(line) + 100).includes('tenant_id')) {
         violations.push({ file, line: i + 1, type: 'Bad Find (missing tenant_id)', content: line.trim() });
      }
    }
  }
}

console.log(JSON.stringify(violations, null, 2));
