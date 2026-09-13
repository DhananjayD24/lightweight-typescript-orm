import { ModelDefinition } from './schema';

import { AnyColumnBuilder } from './types';

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join('; ')}`);
    this.name = 'ValidationError';
  }
}

export function validateRecord(model: ModelDefinition, data: Record<string, any>, isInsert: boolean = true): Record<string, any> {
  const errors: string[] = [];
  const processedData: Record<string, any> = { ...data };

  for (const [colName, builder] of Object.entries(model.schema) as [string, AnyColumnBuilder][]) {
    const opts = builder.options;
    let val = processedData[colName];

    // Handle missing value on insert
    if (val === undefined || val === null) {
      if (opts.defaultValue !== undefined && isInsert) {
        val = typeof opts.defaultValue === 'function' ? opts.defaultValue() : opts.defaultValue;
        processedData[colName] = val;
      } else if (!opts.optional && !opts.autoIncrement && isInsert) {
        errors.push(`Field '${colName}' is required on model '${model.tableName}'`);
        continue;
      }
    }

    if (val !== undefined && val !== null) {
      // Type checks
      if (opts.dataType === 'number' && typeof val !== 'number') {
        errors.push(`Field '${colName}' must be a number on model '${model.tableName}'`);
      } else if (opts.dataType === 'string' && typeof val !== 'string') {
        errors.push(`Field '${colName}' must be a string on model '${model.tableName}'`);
      } else if (opts.dataType === 'boolean' && typeof val !== 'boolean') {
        errors.push(`Field '${colName}' must be a boolean on model '${model.tableName}'`);
      } else if (opts.dataType === 'date' && !(val instanceof Date) && typeof val !== 'string' && typeof val !== 'number') {
        errors.push(`Field '${colName}' must be a valid Date on model '${model.tableName}'`);
      }

      // Custom validator check
      if (opts.validate) {
        const validationResult = opts.validate(val);
        if (validationResult === false) {
          errors.push(`Field '${colName}' failed validation rule on model '${model.tableName}'`);
        } else if (typeof validationResult === 'string') {
          errors.push(`Field '${colName}' validation error: ${validationResult}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return processedData;
}
