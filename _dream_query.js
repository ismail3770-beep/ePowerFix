const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync('C:\\Users\\fulba\\.local\\share\\mimocode\\mimocode.db', { open: true, readOnly: true });

// Get user messages with text content from the big session
const bigSession = 'ses_0b8d96160ffezKmChnRLRTzfY4';
console.log(`=== BIG SESSION USER MESSAGES ===`);
const parts = db.prepare(`
  SELECT p.id, p.message_id, json_extract(p.data, '$.type') as type, 
         json_extract(p.data, '$.text') as text,
         substr(p.data, 1, 500) as preview
  FROM part p
  WHERE p.session_id = '${bigSession}'
    AND json_extract(p.data, '$.type') = 'text'
  ORDER BY p.time_created
`).all();
parts.forEach(p => {
  if (p.text) {
    console.log(`  [${p.message_id}] ${p.text.substring(0, 200)}`);
  }
});

// Get user messages from audit session
const auditSession = 'ses_0b8d96183ffepDyA3rZVeEVKJQ';
console.log(`\n=== AUDIT SESSION USER MESSAGES ===`);
const auditParts = db.prepare(`
  SELECT p.id, p.message_id, json_extract(p.data, '$.type') as type, 
         json_extract(p.data, '$.text') as text
  FROM part p
  WHERE p.session_id = '${auditSession}'
    AND json_extract(p.data, '$.type') = 'text'
  ORDER BY p.time_created
`).all();
auditParts.forEach(p => {
  if (p.text) {
    console.log(`  [${p.message_id}] ${p.text.substring(0, 300)}`);
  }
});

// Check for tool calls that wrote files
console.log(`\n=== TOOL CALLS THAT WROTE FILES (all sessions) ===`);
const writeToolCalls = db.prepare(`
  SELECT p.session_id, json_extract(p.data, '$.tool') as tool,
         substr(json_extract(json_extract(p.data, '$.state'), '$.input'), 1, 300) as input_preview
  FROM part p
  WHERE json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') IN ('write', 'edit', 'create')
  ORDER BY p.time_created
`).all();
writeToolCalls.forEach(tc => {
  console.log(`  [${tc.session_id}] ${tc.tool}: ${tc.input_preview}`);
});

// Check for bash tool calls
console.log(`\n=== BASH TOOL CALLS (all sessions) ===`);
const bashCalls = db.prepare(`
  SELECT p.session_id, json_extract(json_extract(p.data, '$.state'), '$.input') as cmd
  FROM part p
  WHERE json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') = 'bash'
  ORDER BY p.time_created
`).all();
bashCalls.forEach(bc => {
  console.log(`  [${bc.session_id}] ${bc.cmd?.substring(0, 200)}`);
});

db.close();
