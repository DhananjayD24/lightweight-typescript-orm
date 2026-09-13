import { ModelDefinition } from './schema.js';
import { DatabaseDriver, AnyColumnBuilder } from './types.js';
import { buildCreateTableSql, escapeIdentifier } from './sql-generator.js';

export interface SyncOptions {
  force?: boolean;
}

export async function syncDatabase(
  driver: DatabaseDriver,
  models: Record<string, ModelDefinition>,
  options: SyncOptions = {}
): Promise<void> {
  const modelList = Object.values(models);

  if (options.force) {
    // Drop tables in reverse order to respect constraints
    for (const model of [...modelList].reverse()) {
      const sql = `DROP TABLE IF EXISTS ${escapeIdentifier(model.tableName)} CASCADE;`;
      await driver.query(sql);
    }
  }

  // Topological sort or simple 2-pass order to create referenced tables first
  const created = new Set<string>();
  const remaining = [...modelList];

  let progress = true;
  while (remaining.length > 0 && progress) {
    progress = false;
    for (let i = 0; i < remaining.length; i++) {
      const model = remaining[i];
      let hasUncreatedRef = false;

      for (const builder of Object.values(model.schema) as AnyColumnBuilder[]) {
        const ref = builder.options.references;
        if (ref && ref.modelName !== model.tableName && !created.has(ref.modelName)) {
          hasUncreatedRef = true;
          break;
        }
      }

      if (!hasUncreatedRef) {
        const sql = buildCreateTableSql(model);
        await driver.query(sql);
        created.add(model.tableName);
        remaining.splice(i, 1);
        progress = true;
        break;
      }
    }
  }

  // Any remaining circular tables
  for (const model of remaining) {
    const sql = buildCreateTableSql(model);
    await driver.query(sql);
  }
}
