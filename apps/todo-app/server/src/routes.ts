import { Router, Request, Response } from 'express';
import { db } from './db';

export const router = Router();

// Health Check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databaseFallback: (db.$driver as any).isFallbackMemory ? 'In-Memory Simulation' : 'Connected Postgres',
  });
});

// Force DDL Sync via ORM
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const force = req.body.force === true;
    await db.sync({ force });
    res.json({ success: true, message: `Database synced (force=${force})` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await db.category.findMany({
      orderBy: { id: 'ASC' },
    });
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Category
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    const category = await db.category.create({
      name,
      color: color || '#3b82f6',
    });
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// List Todos with query filtering, searching, and relation inclusion
router.get('/todos', async (req: Request, res: Response) => {
  try {
    const { status, categoryId, search, priority } = req.query;

    const where: any = {};

    if (status === 'completed') {
      where.completed = true;
    } else if (status === 'active') {
      where.completed = false;
    }

    if (categoryId && !isNaN(Number(categoryId))) {
      where.categoryId = Number(categoryId);
    }

    if (priority && typeof priority === 'string') {
      where.priority = priority;
    }

    // Execute typed ORM findMany with relational include
    let todos = await db.todo.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { id: 'DESC' },
      include: { category: true },
    });

    // In-memory text search if search query supplied
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      todos = todos.filter((t) => t.title.toLowerCase().includes(q));
    }

    res.json(todos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Todo using ORM
router.post('/todos', async (req: Request, res: Response) => {
  try {
    const { title, priority, categoryId } = req.body;

    const newTodo = await db.todo.create({
      title,
      completed: false,
      priority: priority || 'medium',
      categoryId: categoryId ? Number(categoryId) : undefined,
    });

    // Fetch with relation
    const fullTodo = await db.todo.findOne({
      where: { id: newTodo.id },
      include: { category: true },
    });

    res.status(201).json(fullTodo || newTodo);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Todo (e.g. toggle completion status, edit title, category)
router.patch('/todos/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, completed, priority, categoryId } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = Boolean(completed);
    if (priority !== undefined) updateData.priority = priority;
    if (categoryId !== undefined) updateData.categoryId = categoryId ? Number(categoryId) : null;

    const updated = await db.todo.updateOne({
      where: { id },
      data: updateData,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Fetch updated record with relation
    const fullTodo = await db.todo.findOne({
      where: { id: updated.id },
      include: { category: true },
    });

    res.json(fullTodo || updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Todo using ORM
router.delete('/todos/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await db.todo.delete({ where: { id } });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Summary Statistics (demonstrating ORM aggregate & transaction)
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalCount = await db.todo.count();
    const completedCount = await db.todo.count({ where: { completed: true } });
    const activeCount = await db.todo.count({ where: { completed: false } });
    const categoryCount = await db.category.count();

    res.json({
      total: totalCount,
      completed: completedCount,
      active: activeCount,
      categoriesCount: categoryCount,
      completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
