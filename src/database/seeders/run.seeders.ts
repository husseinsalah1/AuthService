import 'dotenv/config';
import dataSource from '../../configs/typeorm.datasource';
import { seedPermissions } from './permissions.seeder';
import { seederRole } from './role.seeder';

async function runSeeders(): Promise<void> {
  try {
    await dataSource.initialize();
    await seedPermissions(dataSource);
    await seederRole(dataSource);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runSeeders()
  .then(() => {
    console.log('Seeders completed successfully');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Seeders failed', error);
    process.exit(1);
  });
