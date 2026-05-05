require('dotenv').config();
const { AuditLog } = require('./src/models');

async function testAudit() {
  try {
    const logs = await AuditLog.findAll({ limit: 1 });
    console.log(JSON.stringify(logs[0], null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testAudit();
