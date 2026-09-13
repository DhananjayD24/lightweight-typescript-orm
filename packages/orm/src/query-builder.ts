import { ModelDefinition } from './schema';
import {
  DatabaseDriver,
  SelectQueryOptions,
  WhereClause,
  OrderByOptions,
  InferModel,
  InferInsert,
  InferUpdate,
} from './types';
import { validateRecord } from './validation';
import {
  buildSelectSql,
  buildInsertSql,
  buildUpdateSql,
  buildDeleteSql,
} from './sql-generator';

export class QueryChainBuilder<TSchema extends any = any, TResult = any> {
  private options: SelectQueryOptions<TSchema> = {};

  constructor(
    private model: ModelDefinition,
    private driver: DatabaseDriver,
    private allModels?: Record<string, ModelDefinition>
  ) {}

  where(whereClause: WhereClause<TSchema>): this {
    this.options.where = { ...this.options.where, ...whereClause };
    return this;
  }

  orderBy(orderByClause: OrderByOptions<TSchema>): this {
    this.options.orderBy = { ...this.options.orderBy, ...orderByClause };
    return this;
  }

  limit(limitCount: number): this {
    this.options.limit = limitCount;
    return this;
  }

  offset(offsetCount: number): this {
    this.options.offset = offsetCount;
    return this;
  }

  include(relations: Record<string, boolean>): this {
    this.options.include = relations;
    return this;
  }

  async execute(): Promise<TResult[]> {
    const modelDelegate = new ModelDelegate(this.model, this.driver, this.allModels);
    const rows = await modelDelegate.findMany(this.options);
    return rows as unknown as TResult[];
  }
}

export class ModelDelegate<TDef extends ModelDefinition = any> {
  constructor(
    public model: TDef,
    private driver: DatabaseDriver,
    private allModels?: Record<string, ModelDefinition>
  ) {}

  query(): QueryChainBuilder<TDef['$inferSelect'], TDef['$inferSelect']> {
    return new QueryChainBuilder<TDef['$inferSelect'], TDef['$inferSelect']>(
      this.model,
      this.driver,
      this.allModels
    );
  }

  async create(data: TDef['$inferInsert']): Promise<TDef['$inferSelect']> {
    const validatedData = validateRecord(this.model, data as any, true);
    const { text, values } = buildInsertSql(this.model, validatedData);
    const res = await this.driver.query<TDef['$inferSelect']>(text, values);
    return res.rows[0];
  }

  async createMany(dataList: TDef['$inferInsert'][]): Promise<TDef['$inferSelect'][]> {
    const results: TDef['$inferSelect'][] = [];
    for (const data of dataList) {
      const created = await this.create(data);
      results.push(created);
    }
    return results;
  }

  async findMany(options: SelectQueryOptions<TDef['$inferSelect']> = {}): Promise<TDef['$inferSelect'][]> {
    const { text, values } = buildSelectSql(this.model, options);
    const res = await this.driver.query<TDef['$inferSelect']>(text, values);
    let rows = res.rows;

    // Relational include handling
    if (options.include && this.allModels && Object.keys(options.include).length > 0) {
      for (const [relProp, enabled] of Object.entries(options.include)) {
        if (!enabled) continue;

        const relDef = this.model.relations[relProp];
        if (!relDef) continue;

        const targetModel = this.allModels[relDef.targetModelName] || 
          Object.values(this.allModels).find(m => m.tableName === relDef.targetModelName);

        if (!targetModel) continue;

        const targetDelegate = new ModelDelegate(targetModel, this.driver, this.allModels);

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] as any;
          if (relDef.type === 'belongsTo') {
            const foreignVal = row[relDef.foreignKey];
            if (foreignVal !== undefined && foreignVal !== null) {
              const relMatch = await targetDelegate.findOne({
                where: { [relDef.primaryKey]: foreignVal } as any
              });
              row[relProp] = relMatch || null;
            } else {
              row[relProp] = null;
            }
          } else if (relDef.type === 'hasMany') {
            const pkVal = row[this.model.primaryKey];
            if (pkVal !== undefined && pkVal !== null) {
              const relMatches = await targetDelegate.findMany({
                where: { [relDef.foreignKey]: pkVal } as any
              });
              row[relProp] = relMatches;
            } else {
              row[relProp] = [];
            }
          }
        }
      }
    }

    return rows;
  }

  async findOne(options: SelectQueryOptions<TDef['$inferSelect']> = {}): Promise<TDef['$inferSelect'] | null> {
    const results = await this.findMany({ ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async findById(id: any): Promise<TDef['$inferSelect'] | null> {
    return this.findOne({ where: { [this.model.primaryKey]: id } as any });
  }

  async update(options: {
    where: WhereClause<TDef['$inferSelect']>;
    data: TDef['$inferUpdate'];
  }): Promise<TDef['$inferSelect'][]> {
    const validatedData = validateRecord(this.model, options.data as any, false);
    const { text, values } = buildUpdateSql(this.model, options.where, validatedData);
    const res = await this.driver.query<TDef['$inferSelect']>(text, values);
    return res.rows;
  }

  async updateOne(options: {
    where: WhereClause<TDef['$inferSelect']>;
    data: TDef['$inferUpdate'];
  }): Promise<TDef['$inferSelect'] | null> {
    const updatedRows = await this.update(options);
    return updatedRows.length > 0 ? updatedRows[0] : null;
  }

  async delete(options: { where: WhereClause<TDef['$inferSelect']> }): Promise<{ count: number }> {
    const { text, values } = buildDeleteSql(this.model, options.where);
    const res = await this.driver.query(text, values);
    return { count: res.rowCount };
  }

  async count(options: SelectQueryOptions<TDef['$inferSelect']> = {}): Promise<number> {
    const rows = await this.findMany(options);
    return rows.length;
  }
}
