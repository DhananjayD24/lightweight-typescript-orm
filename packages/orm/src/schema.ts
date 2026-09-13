import { SchemaDefinition, ModelConfig, RelationDefinition, InferModel, InferInsert, InferUpdate } from './types.js';
import { RelationBuilder } from './relations.js';

export interface DefineModelOptions {
  relations?: Record<string, RelationBuilder>;
  primaryKey?: string;
}

export class ModelDefinition<TSchema extends SchemaDefinition = any> {
  public tableName: string;
  public schema: TSchema;
  public primaryKey: string;
  public relations: Record<string, RelationDefinition> = {};

  // TypeScript phantom types for static type inference
  public readonly $inferSelect!: InferModel<TSchema>;
  public readonly $inferInsert!: InferInsert<TSchema>;
  public readonly $inferUpdate!: InferUpdate<TSchema>;

  constructor(tableName: string, schema: TSchema, options?: DefineModelOptions) {
    this.tableName = tableName;
    this.schema = schema;

    // Detect primary key
    let foundPk = options?.primaryKey;
    if (!foundPk) {
      for (const [colName, colBuilder] of Object.entries(schema)) {
        if (colBuilder.options.primaryKey) {
          foundPk = colName;
          break;
        }
      }
    }
    this.primaryKey = foundPk || 'id';

    // Process relations if present
    if (options?.relations) {
      for (const [propName, relBuilder] of Object.entries(options.relations)) {
        const def = { ...relBuilder.definition, propertyName: propName };
        this.relations[propName] = def;
      }
    }
  }

  toConfig(): ModelConfig<TSchema> {
    return {
      tableName: this.tableName,
      schema: this.schema,
      primaryKey: this.primaryKey,
      relations: this.relations,
    };
  }
}

export function defineModel<TSchema extends SchemaDefinition>(
  tableName: string,
  schema: TSchema,
  options?: DefineModelOptions
): ModelDefinition<TSchema> {
  return new ModelDefinition<TSchema>(tableName, schema, options);
}
