const db = require('./config/database');

async function fixAllIndexes() {
  // Get all tables
  const [tables] = await db.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'docclear_db' AND TABLE_TYPE = 'BASE TABLE'");
  
  for (const { TABLE_NAME } of tables) {
    const [indexes] = await db.query(`SHOW INDEX FROM \`${TABLE_NAME}\``);
    
    // Group by column — find duplicates
    const byColumn = {};
    indexes.forEach(idx => {
      if (idx.Key_name === 'PRIMARY') return;
      const key = `${idx.Column_name}_${idx.Non_unique}`;
      if (!byColumn[key]) byColumn[key] = [];
      byColumn[key].push(idx.Key_name);
    });
    
    for (const [col, names] of Object.entries(byColumn)) {
      if (names.length > 1) {
        // Keep the first, drop the rest
        const toDrop = [...new Set(names)].slice(1);
        for (const name of toDrop) {
          try {
            await db.query(`ALTER TABLE \`${TABLE_NAME}\` DROP INDEX \`${name}\``);
            console.log(`Dropped ${TABLE_NAME}.${name}`);
          } catch (e) {
            // Index may have been dropped already
          }
        }
      }
    }
  }
  
  console.log('Done fixing indexes');
  db.close();
}

fixAllIndexes().catch(err => { console.error(err); db.close(); });
