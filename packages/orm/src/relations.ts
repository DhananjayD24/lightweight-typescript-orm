import { RelationDefinition } from './types';

export interface RelationOptions {
  foreignKey?: string;
  primaryKey?: string;
}

export class RelationBuilder {
  public definition: RelationDefinition;

  constructor(
    type: 'belongsTo' | 'hasMany' | 'hasOne',
    targetModel: any,
    options?: RelationOptions
  ) {
    const targetModelName = typeof targetModel === 'string'
      ? targetModel
      : (targetModel?.tableName || targetModel?.name || 'unknown');

    const defaultForeignKey = type === 'belongsTo'
      ? `${targetModelName.toLowerCase()}Id`
      : 'id';

    const defaultPrimaryKey = type === 'belongsTo'
      ? 'id'
      : `${targetModelName.toLowerCase()}Id`;

    this.definition = {
      type,
      targetModelName,
      foreignKey: options?.foreignKey || defaultForeignKey,
      primaryKey: options?.primaryKey || defaultPrimaryKey,
      propertyName: ''
    };
  }
}

export function belongsTo(targetModel: any, options?: RelationOptions): RelationBuilder {
  return new RelationBuilder('belongsTo', targetModel, options);
}

export function hasMany(targetModel: any, options?: RelationOptions): RelationBuilder {
  return new RelationBuilder('hasMany', targetModel, options);
}

export function hasOne(targetModel: any, options?: RelationOptions): RelationBuilder {
  return new RelationBuilder('hasOne', targetModel, options);
}
