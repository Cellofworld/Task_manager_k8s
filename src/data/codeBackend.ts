export const backendCode = {
  indexTs: `import express from 'express';
import cors from 'cors';
import { taskRoutes } from './routes/tasks';
import { pool } from './db';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: (err as Error).message });
  }
});

// Routes
app.use('/api/tasks', taskRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Backend listening on port \${PORT}\`);
});`,

  dbTs: `import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'taskmanager',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});`,

  routesTasks: `import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

// GET /api/tasks — список всех задач
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/tasks — создать задачу
router.post('/', async (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status) VALUES ($1, $2, $3) RETURNING *',
      [title, description || '', 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// PATCH /api/tasks/:id — обновить статус
router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, title, description } = req.body;
  try {
    const result = await pool.query(
      \`UPDATE tasks 
       SET status = COALESCE($1, status),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           updated_at = NOW()
       WHERE id = $4 RETURNING *\`,
      [status, title, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// DELETE /api/tasks/:id — удалить задачу
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export { router as taskRoutes };`,

  packageJson: `{
  "name": "task-manager-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "node-pg-migrate",
    "migrate:up": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "node-pg-migrate": "^7.0.0",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "@types/pg": "^8.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}`,

  tsconfig: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,

  migration: `import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('tasks', {
    id: { type: 'serial', primaryKey: true },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', default: '' },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.addCheckConstraint('tasks', 'tasks_status_check',
    "status IN ('pending', 'in_progress', 'done')"
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('tasks');
}`,

  dockerfile: `# ===== Stage 1: Build =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && cp -R node_modules prod_modules
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ===== Stage 2: Production =====
FROM node:20-alpine AS production
# Non-root user для безопасности
RUN addgroup -g 1001 -S appgroup && \\
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app
COPY --from=builder --chown=appuser:appgroup /app/prod_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

# Миграции тоже нужны
COPY --from=builder --chown=appuser:appgroup /app/node_modules/node-pg-migrate ./node_modules/node-pg-migrate
COPY --from=builder --chown=appuser:appgroup /app/node_modules/.bin ./node_modules/.bin
COPY migrations ./migrations

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["node", "dist/index.js"]`,

  envExample: `# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=taskmanager

# Server
PORT=8080
NODE_ENV=development`,

  dockerCompose: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: taskmanager
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: postgres
      DB_PASSWORD: postgres
      DB_NAME: taskmanager
      PORT: 8080
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "npx node-pg-migrate up && node dist/index.js"

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pgdata:`,
};

export const frontendCode = {
  appTsx: `import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, Task } from './api';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask({ title, description });
      setTitle('');
      setDescription('');
      await fetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await updateTask(id, { status });
    await fetchTasks();
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    await fetchTasks();
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    done: 'Готово',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">📋 Task Manager</h1>
          <p className="text-gray-500 mt-1">Управляй задачами эффективно</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Форма создания */}
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Новая задача</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Название задачи"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Описание (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Создать задачу
            </button>
          </div>
        </form>

        {/* Список задач */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Задач пока нет. Создайте первую! 🎉
            </p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className={\`px-3 py-1 rounded-full text-sm font-medium \${statusColors[task.status]}\`}
                  >
                    <option value="pending">Ожидает</option>
                    <option value="in_progress">В работе</option>
                    <option value="done">Готово</option>
                  </select>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;`,

  api: `import axios from 'axios';

const API_BASE = '/api';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done';
  created_at: string;
  updated_at: string;
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export async function getTasks(): Promise<Task[]> {
  const { data } = await api.get('/tasks');
  return data;
}

export async function createTask(task: { title: string; description?: string }): Promise<Task> {
  const { data } = await api.post('/tasks', task);
  return data;
}

export async function updateTask(
  id: number,
  updates: { status?: string; title?: string; description?: string }
): Promise<Task> {
  const { data } = await api.patch(\`/tasks/\${id}\`, updates);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(\`/tasks/\${id}\`);
}`,

  nginxConf: `server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Проксирование API на backend
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Кэширование статики
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}`,

  frontendDockerfile: `# ===== Stage 1: Build =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ===== Stage 2: Nginx =====
FROM nginx:1.25-alpine AS production
# Удаляем дефолтный конфиг
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`,
};
