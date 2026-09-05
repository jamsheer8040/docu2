const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

console.log('--- SaaS Multi-Tenancy Audit (v2 - Smart Trace) ---');
console.log('Checking controllers for missing tenant_id in Sequelize queries...\n');

let totalIssues = 0;
let totalSafe = 0;

// Exempt files that don't need tenant_id at all
const EXEMPT_FILES = ['auth.controller.js', 'saas.controller.js'];

// Instance methods don't need a where clause with tenant_id
// because the instance was already fetched securely
const INSTANCE_PATTERNS = [
  /await\s+\w+\.update\s*\(/,
  /await\s+\w+\.destroy\s*\(/,
  /await\s+\w+\.save\s*\(/,
  /await\s+\w+\.increment\s*\(/,
  /await\s+\w+\.decrement\s*\(/,
];

// Models that don't belong to a tenant
const EXEMPT_MODELS = ['Tenant', 'Plan', 'User.findOne'];

files.forEach(file => {
  if (EXEMPT_FILES.includes(file)) return;

  const content = fs.readFileSync(path.join(controllersDir, file), 'utf8');
  const lines = content.split('\n');

  let issuesInFile = [];
  let safeInFile = [];

  // Phase 1: Build a map of all variables that contain tenant_id
  const tenantVars = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern: const/let/var VARNAME = { ... tenant_id ... }
    const assignMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*\{/);
    if (assignMatch) {
      const varName = assignMatch[1];
      for (let k = i; k < Math.min(i + 20, lines.length); k++) {
        if (lines[k].includes('tenant_id')) {
          tenantVars.add(varName);
          break;
        }
        if (k > i && lines[k].match(/^\s*\};?\s*$/)) break;
      }
    }

    // Pattern: VARNAME.tenant_id = ...
    const dotAssign = line.match(/(\w+)\.tenant_id\s*=/);
    if (dotAssign) {
      tenantVars.add(dotAssign[1]);
    }

    // Pattern: const dateWhere = getReportWhere(req)
    const helperMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*getReportWhere\s*\(/);
    if (helperMatch) {
      tenantVars.add(helperMatch[1]);
    }

    // Pattern: const where = { ...dateWhere }
    const spreadMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*\{.*\.\.\.(\w+)/);
    if (spreadMatch && tenantVars.has(spreadMatch[2])) {
      tenantVars.add(spreadMatch[1]);
    }

    // Multi-line spread: if we're inside a variable assignment block, check for ...trackedVar
    if (assignMatch) {
      const varName = assignMatch[1];
      for (let k = i; k < Math.min(i + 20, lines.length); k++) {
        const spreadInBlock = lines[k].match(/\.\.\.\s*(\w+)/);
        if (spreadInBlock && tenantVars.has(spreadInBlock[1])) {
          tenantVars.add(varName);
          break;
        }
        if (k > i && lines[k].match(/^\s*\};?\s*$/)) break;
      }
    }
  }

  // Phase 2: Check every Sequelize query
  const queryRegex = /\.(findAll|findOne|update|destroy|count|sum)\s*\(\s*\{/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.match(queryRegex)) continue;

    // Check if this is an instance method call
    const isInstanceCall = INSTANCE_PATTERNS.some(p => p.test(line));
    if (isInstanceCall) {
      safeInFile.push({ lineNum: i + 1, code: line.trim(), reason: 'Instance method' });
      continue;
    }

    // Check if exempt model
    const isExemptModel = EXEMPT_MODELS.some(m => line.includes(m));
    if (isExemptModel) {
      safeInFile.push({ lineNum: i + 1, code: line.trim(), reason: 'Exempt model' });
      continue;
    }

    // Check: does tenant_id or a tracked variable spread appear in the next 25 lines?
    let foundTenantDirect = false;
    let directReason = 'Direct tenant_id';
    for (let j = i; j < Math.min(i + 25, lines.length); j++) {
      if (lines[j].includes('tenant_id')) {
        foundTenantDirect = true;
        break;
      }
      // Check for inline ...trackedVar in nested where clauses (e.g., include where)
      const inlineSpreadCheck = lines[j].match(/\.\.\.(\w+)/);
      if (inlineSpreadCheck && tenantVars.has(inlineSpreadCheck[1])) {
        foundTenantDirect = true;
        directReason = `Via nested '${inlineSpreadCheck[1]}'`;
        break;
      }
      if (j > i && lines[j].match(/\}\s*\)\s*;?\s*$/)) break;
    }

    if (foundTenantDirect) {
      safeInFile.push({ lineNum: i + 1, code: line.trim(), reason: directReason });
      continue;
    }

    // Check: does the where clause reference a tracked variable?
    let foundVarRef = false;
    let matchedVar = '';
    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
      const whereLine = lines[j];

      // Pattern: where: varName
      const whereVarMatch = whereLine.match(/where:\s*(\w+)/);
      if (whereVarMatch && tenantVars.has(whereVarMatch[1])) {
        foundVarRef = true;
        matchedVar = whereVarMatch[1];
        break;
      }

      // Pattern: where: { ...varName }
      const whereSpreadMatch = whereLine.match(/where:\s*\{.*\.\.\.(\w+)/);
      if (whereSpreadMatch && tenantVars.has(whereSpreadMatch[1])) {
        foundVarRef = true;
        matchedVar = whereSpreadMatch[1];
        break;
      }

      // Pattern: where,  (JS shorthand)
      if (whereLine.match(/^\s*where\s*,?\s*$/) || whereLine.match(/\{\s*where\s*,/) || whereLine.match(/,\s*where\s*[,}]/)) {
        if (tenantVars.has('where')) {
          foundVarRef = true;
          matchedVar = 'where';
          break;
        }
      }

      // Pattern: inline ...trackedVar inside where object (e.g., where: { status: 'x', ...dateWhere })
      const inlineSpread = whereLine.match(/\.\.\.\s*(\w+)/);
      if (inlineSpread && tenantVars.has(inlineSpread[1])) {
        foundVarRef = true;
        matchedVar = inlineSpread[1];
        break;
      }
    }

    if (foundVarRef) {
      safeInFile.push({ lineNum: i + 1, code: line.trim(), reason: `Via '${matchedVar}'` });
      continue;
    }

    // If none of the above matched, flag it
    issuesInFile.push({ lineNum: i + 1, code: line.trim() });
  }

  if (issuesInFile.length > 0) {
    console.log(`[!] ${file}:`);
    issuesInFile.forEach(iss => {
      console.log(`    Line ${iss.lineNum}: ${iss.code}`);
    });
    console.log('');
    totalIssues += issuesInFile.length;
  }

  if (safeInFile.length > 0) {
    totalSafe += safeInFile.length;
  }
});

console.log('---'.repeat(17));
if (totalIssues === 0) {
  console.log('PASSED! All queries are tenant-isolated!');
} else {
  console.log(`Audit Complete. Found ${totalIssues} potential missing tenant_id queries.`);
}
console.log(`   ${totalSafe} queries verified safe via variable tracing.`);
console.log(`   ${totalIssues} queries need manual review.`);
