import { defineModel, number, string, boolean, belongsTo, hasMany } from 'lightweight-ts-orm';

export const Category = defineModel('category', {
  id: number().primaryKey(),
  name: string().validate((val) => val.trim().length > 0 || 'Category name cannot be empty'),
  color: string().default('#3b82f6'),
});

export const Todo = defineModel(
  'todo',
  {
    id: number().primaryKey(),
    title: string().validate((val) => val.trim().length > 0 || 'Todo title cannot be empty'),
    completed: boolean().default(false),
    priority: string().default('medium'),
    categoryId: number().optional().references(Category, 'id'),
  },
  {
    relations: {
      category: belongsTo(Category, { foreignKey: 'categoryId' }),
    },
  }
);
