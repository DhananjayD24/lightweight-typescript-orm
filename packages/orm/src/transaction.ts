import { DatabaseDriver } from './types.js';

export async function executeTransaction<T>(
  driver: DatabaseDriver,
  callback: (txDriver: DatabaseDriver) => Promise<T>
): Promise<T> {
  if (driver.transaction) {
    return driver.transaction(callback);
  }

  await driver.query('BEGIN');
  try {
    const result = await callback(driver);
    await driver.query('COMMIT');
    return result;
  } catch (error) {
    await driver.query('ROLLBACK');
    throw error;
  }
}
