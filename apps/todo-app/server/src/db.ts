import dotenv from 'dotenv';
import { createDatabase } from 'lightweight-ts-orm';
import { Category, Todo } from './models.js';

dotenv.config();

export const db = createDatabase({
  connectionString: process.env.DATABASE_URL || undefined,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  models: {
    category: Category,
    todo: Todo,
  },
});

export async function initDb() {
  try {
    console.log('[Database]: Initializing schema synchronization via ORM...');
    await db.sync({ force: false });
    console.log('[Database]: Schema sync complete.');

    // Seed default categories if none exist
    const categoryCount = await db.category.count();
    // if (categoryCount === 0) {
    //   console.log('[Database]: Seeding default categories...');
    //   const work = await db.category.create({ name: 'Work', color: '#6366f1' });
    //   const personal = await db.category.create({ name: 'Personal', color: '#ec4899' });
    //   const shopping = await db.category.create({ name: 'Shopping', color: '#10b981' });

    //   // Seed initial sample todos
    //   await db.todo.create({ title: 'Complete TypeScript ORM assignment', completed: false, priority: 'high', categoryId: work.id });
    //   await db.todo.create({ title: 'Buy groceries for the week', completed: true, priority: 'medium', categoryId: shopping.id });
    //   await db.todo.create({ title: 'Plan weekend trip', completed: false, priority: 'low', categoryId: personal.id });
    // }
  } catch (err: any) {
    console.warn(`[Database Init Warning]: ${err.message}`);
  }
}
