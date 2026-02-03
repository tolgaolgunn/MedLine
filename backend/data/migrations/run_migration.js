const fs = require('fs');
const path = require('path');
const pool = require('../../config/db');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const migrationFile = path.join(__dirname, 'add_record_type_to_medical_results.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    await client.query(sql);
    
    await client.query('COMMIT');
    console.log('Migration completed successfully: add_record_type_to_medical_results');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Eğer doğrudan çalıştırılıyorsa
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = runMigration;

