const { execSync } = require('child_process');

try {
  console.log('[Prisma] Attempting database migration deployment...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('[Prisma] Database migration completed successfully.');
} catch (error) {
  console.warn('[Prisma] Database migration skipped or handled gracefully:', error.message);
}
