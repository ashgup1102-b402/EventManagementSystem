require('dotenv').config();
const { AuditLog } = require('../src/models');
const { hasChanges } = require('../src/utils/historyHelper');

async function cleanup() {
  console.log('Starting Audit Log Cleanup...');
  try {
    const logs = await AuditLog.findAll();
    let deletedCount = 0;
    
    for (const log of logs) {
      if (log.action.includes('UPDATE')) {
        const changes = hasChanges(log.old_values || {}, log.new_values || {});
        if (!changes) {
          await log.destroy();
          deletedCount++;
        }
      }
    }
    
    console.log(`Cleanup complete. Deleted ${deletedCount} redundant logs.`);
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
