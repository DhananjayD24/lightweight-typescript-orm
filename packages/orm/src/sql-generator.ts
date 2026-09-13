import { ModelDefinition } from './schema.js';
import { WhereClause, OrderByOptions, SelectQueryOptions, AnyColumnBuilder } from './types.js';

export interface GeneratedQuery {
  text: string;
  values: any[];
}

export function escapeIdentifier(str: string): string {
  return `"${str.replace(/"/g, '""')}"`;
}

export function buildWhereClause(
  where: WhereClause<any> | undefined,
  params: any[],
  tableName?: string
): string {
  if (!where || Object.keys(where).length === 0) {
    return '';
  }

  const conditions: string[] = [];

  for (const [key, val] of Object.entries(where)) {
    if (key === '$and' && Array.isArray(val)) {
      const andConds = val
        .map((subWhere) => buildWhereClause(subWhere, params, tableName))
        .filter(Boolean);
      if (andConds.length > 0) {
        conditions.push(`(${andConds.join(' AND ')})`);
      }
      continue;
    }

    if (key === '$or' && Array.isArray(val)) {
      const orConds = val
        .map((subWhere) => buildWhereClause(subWhere, params, tableName))
        .filter(Boolean);
      if (orConds.length > 0) {
        conditions.push(`(${orConds.join(' OR ')})`);
      }
      continue;
    }

    const colName = tableName ? `${escapeIdentifier(tableName)}.${escapeIdentifier(key)}` : escapeIdentifier(key);

    if (val === null || val === undefined) {
      conditions.push(`${colName} IS NULL`);
      continue;
    }

    if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      // Operators like $eq, $ne, $gt, $gte, $lt, $lte, $like, $in, $notIn, $isNull
      const opObj = val as any;
      if ('$eq' in opObj) {
        params.push(opObj.$eq);
        conditions.push(`${colName} = $${params.length}`);
      }
      if ('$ne' in opObj) {
        params.push(opObj.$ne);
        conditions.push(`${colName} != $${params.length}`);
      }
      if ('$gt' in opObj) {
        params.push(opObj.$gt);
        conditions.push(`${colName} > $${params.length}`);
      }
      if ('$gte' in opObj) {
        params.push(opObj.$gte);
        conditions.push(`${colName} >= $${params.length}`);
      }
      if ('$lt' in opObj) {
        params.push(opObj.$lt);
        conditions.push(`${colName} < $${params.length}`);
      }
      if ('$lte' in opObj) {
        params.push(opObj.$lte);
        conditions.push(`${colName} <= $${params.length}`);
      }
      if ('$like' in opObj) {
        params.push(opObj.$like);
        conditions.push(`${colName} LIKE $${params.length}`);
      }
      if ('$in' in opObj && Array.isArray(opObj.$in)) {
        const inPlaceholders = opObj.$in.map((item: any) => {
          params.push(item);
          return `$${params.length}`;
        });
        conditions.push(`${colName} IN (${inPlaceholders.join(', ')})`);
      }
      if ('$notIn' in opObj && Array.isArray(opObj.$notIn)) {
        const inPlaceholders = opObj.$notIn.map((item: any) => {
          params.push(item);
          return `$${params.length}`;
        });
        conditions.push(`${colName} NOT IN (${inPlaceholders.join(', ')})`);
      }
      if ('$isNull' in opObj) {
        conditions.push(opObj.$isNull ? `${colName} IS NULL` : `${colName} IS NOT NULL`);
      }
    } else {
      // Direct equality
      params.push(val);
      conditions.push(`${colName} = $${params.length}`);
    }
  }

  return conditions.length > 0 ? conditions.join(' AND ') : '';
}

export function buildOrderByClause(orderBy: OrderByOptions<any> | undefined, tableName?: string): string {
  if (!orderBy || Object.keys(orderBy).length === 0) {
    return '';
  }

  const parts: string[] = [];
  for (const [col, dir] of Object.entries(orderBy)) {
    const colName = tableName ? `${escapeIdentifier(tableName)}.${escapeIdentifier(col)}` : escapeIdentifier(col);
    const direction = String(dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    parts.push(`${colName} ${direction}`);
  }

  return parts.length > 0 ? `ORDER BY ${parts.join(', ')}` : '';
}

export function buildSelectSql(model: ModelDefinition, options: SelectQueryOptions = {}): GeneratedQuery {
  const params: any[] = [];
  const tName = model.tableName;
  const escapedTable = escapeIdentifier(tName);

  // Column list
  const cols = Object.keys(model.schema).map(col => `${escapedTable}.${escapeIdentifier(col)}`);
  let selectClause = `SELECT ${cols.join(', ')}`;
  let fromClause = `FROM ${escapedTable}`;

  const whereSql = buildWhereClause(options.where, params, tName);
  const orderBySql = buildOrderByClause(options.orderBy, tName);

  let query = `${selectClause} ${fromClause}`;
  if (whereSql) {
    query += ` WHERE ${whereSql}`;
  }
  if (orderBySql) {
    query += ` ${orderBySql}`;
  }
  if (options.limit !== undefined) {
    params.push(options.limit);
    query += ` LIMIT $${params.length}`;
  }
  if (options.offset !== undefined) {
    params.push(options.offset);
    query += ` OFFSET $${params.length}`;
  }

  return { text: query, values: params };
}

export function buildInsertSql(model: ModelDefinition, data: Record<string, any>): GeneratedQuery {
  const params: any[] = [];
  const cols: string[] = [];
  const placeholders: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cols.push(escapeIdentifier(key));
      params.push(value);
      placeholders.push(`$${params.length}`);
    }
  }

  const tableName = escapeIdentifier(model.tableName);
  const returningCols = Object.keys(model.schema).map(escapeIdentifier).join(', ');
  
  const text = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${returningCols}`;
  return { text, values: params };
}

export function buildUpdateSql(model: ModelDefinition, where: WhereClause<any>, data: Record<string, any>): GeneratedQuery {
  const params: any[] = [];
  const setClauses: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      params.push(value);
      setClauses.push(`${escapeIdentifier(key)} = $${params.length}`);
    }
  }

  const tableName = escapeIdentifier(model.tableName);
  const whereSql = buildWhereClause(where, params);
  const returningCols = Object.keys(model.schema).map(escapeIdentifier).join(', ');

  let text = `UPDATE ${tableName} SET ${setClauses.join(', ')}`;
  if (whereSql) {
    text += ` WHERE ${whereSql}`;
  }
  text += ` RETURNING ${returningCols}`;

  return { text, values: params };
}

export function buildDeleteSql(model: ModelDefinition, where: WhereClause<any>): GeneratedQuery {
  const params: any[] = [];
  const tableName = escapeIdentifier(model.tableName);
  const whereSql = buildWhereClause(where, params);

  let text = `DELETE FROM ${tableName}`;
  if (whereSql) {
    text += ` WHERE ${whereSql}`;
  }

  return { text, values: params };
}

export function mapDataTypeToPg(builder: any): string {
  const opts = builder.options;
  if (opts.primaryKey && opts.dataType === 'number') {
    return 'SERIAL PRIMARY KEY';
  }

  let pgType = 'TEXT';
  switch (opts.dataType) {
    case 'number':
      pgType = 'INTEGER';
      break;
    case 'string':
      pgType = 'VARCHAR(255)';
      break;
    case 'boolean':
      pgType = 'BOOLEAN';
      break;
    case 'date':
      pgType = 'TIMESTAMP WITH TIME ZONE';
      break;
    case 'json':
      pgType = 'JSONB';
      break;
  }

  const parts = [pgType];
  if (opts.primaryKey && opts.dataType !== 'number') {
    parts.push('PRIMARY KEY');
  }
  if (!opts.optional && !opts.primaryKey) {
    parts.push('NOT NULL');
  }

  return parts.join(' ');
}

export function buildCreateTableSql(model: ModelDefinition): string {
  const tName = escapeIdentifier(model.tableName);
  const colDefs: string[] = [];

  for (const [colName, builder] of Object.entries(model.schema) as [string, AnyColumnBuilder][]) {
    const escapedCol = escapeIdentifier(colName);
    const pgDef = mapDataTypeToPg(builder);
    colDefs.push(`${escapedCol} ${pgDef}`);
  }

  // Foreign key constraints
  for (const [colName, builder] of Object.entries(model.schema) as [string, AnyColumnBuilder][]) {
    const ref = builder.options.references;
    if (ref) {
      colDefs.push(
        `CONSTRAINT "fk_${model.tableName}_${colName}" FOREIGN KEY (${escapeIdentifier(colName)}) REFERENCES ${escapeIdentifier(ref.modelName)}(${escapeIdentifier(ref.column)}) ON DELETE CASCADE`
      );
    }
  }

  return `CREATE TABLE IF NOT EXISTS ${tName} (\n  ${colDefs.join(',\n  ')}\n);`;
}
