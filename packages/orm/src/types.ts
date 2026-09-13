export type DataType = 'number' | 'string' | 'boolean' | 'date' | 'json';

export interface ColumnOptions<T = any> {
  dataType: DataType;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  optional?: boolean;
  defaultValue?: T | (() => T);
  validate?: (value: any) => boolean | string;
  references?: {
    modelName: string;
    column: string;
  };
}

export class ColumnBuilder<TType = any, TOptional extends boolean = false, THasDefault extends boolean = false> {
  public options: ColumnOptions<TType>;

  constructor(dataType: DataType) {
    this.options = { dataType };
  }

  primaryKey(): ColumnBuilder<TType, false, true> {
    this.options.primaryKey = true;
    if (this.options.dataType === 'number') {
      this.options.autoIncrement = true;
    }
    return this as any;
  }

  optional(): ColumnBuilder<TType, true, THasDefault> {
    this.options.optional = true;
    return this as any;
  }

  default(val: TType | (() => TType)): ColumnBuilder<TType, TOptional, true> {
    this.options.defaultValue = val;
    return this as any;
  }

  validate(validatorFn: (value: TType) => boolean | string): this {
    this.options.validate = validatorFn;
    return this;
  }

  references(targetModel: any, column: string = 'id'): this {
    const targetName = typeof targetModel === 'string' 
      ? targetModel 
      : (targetModel?.tableName || targetModel?.name);
    this.options.references = { modelName: targetName, column };
    return this;
  }
}

export type AnyColumnBuilder = ColumnBuilder<any, any, any>;

export type SchemaDefinition = Record<string, AnyColumnBuilder>;

// Type inference generics
export type InferColumnType<TBuilder> = TBuilder extends ColumnBuilder<infer TType, infer TOptional, any>
  ? TOptional extends true ? TType | null | undefined : TType
  : never;

export type InferModel<TSchema extends SchemaDefinition> = {
  [K in keyof TSchema]: InferColumnType<TSchema[K]>;
};

export type InferInsert<TSchema extends SchemaDefinition> = {
  [K in keyof TSchema as TSchema[K] extends ColumnBuilder<any, true, any> | ColumnBuilder<any, any, true>
    ? never
    : K]: InferColumnType<TSchema[K]>;
} & {
  [K in keyof TSchema as TSchema[K] extends ColumnBuilder<any, true, any> | ColumnBuilder<any, any, true>
    ? K
    : never]?: InferColumnType<TSchema[K]>;
};

export type InferUpdate<TSchema extends SchemaDefinition> = {
  [K in keyof TSchema]?: InferColumnType<TSchema[K]>;
};

export type WhereOperators<T> = {
  $eq?: T;
  $ne?: T;
  $gt?: T;
  $gte?: T;
  $lt?: T;
  $lte?: T;
  $like?: string;
  $in?: T[];
  $notIn?: T[];
  $isNull?: boolean;
};

export type WhereClause<TSchema> = {
  [K in keyof TSchema]?: TSchema[K] | WhereOperators<TSchema[K]>;
} & {
  $and?: WhereClause<TSchema>[];
  $or?: WhereClause<TSchema>[];
};

export type OrderByOptions<TSchema> = {
  [K in keyof TSchema]?: 'ASC' | 'DESC' | 'asc' | 'desc';
};

export interface SelectQueryOptions<TSchema = any, TRelations = any> {
  where?: WhereClause<TSchema>;
  orderBy?: OrderByOptions<TSchema>;
  limit?: number;
  offset?: number;
  include?: TRelations;
}

export interface RelationDefinition {
  type: 'belongsTo' | 'hasMany' | 'hasOne';
  targetModelName: string;
  foreignKey: string;
  primaryKey: string;
  propertyName: string;
}

export interface ModelConfig<TSchema extends SchemaDefinition = any> {
  tableName: string;
  schema: TSchema;
  primaryKey: string;
  relations: Record<string, RelationDefinition>;
}

export interface DbQueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseDriver {
  query<T = any>(sql: string, params?: any[]): Promise<DbQueryResult<T>>;
  transaction<T>(callback: (txDriver: DatabaseDriver) => Promise<T>): Promise<T>;
  close?(): Promise<void>;
}
