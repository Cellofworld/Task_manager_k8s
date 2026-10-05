import { useState, useEffect } from 'react';
import CodeBlock from './components/CodeBlock';
import { backendCode, frontendCode } from './data/codeBackend';
import { k8sManifests } from './data/k8sManifests';

type Section = 'overview' | 'architecture' | 'backend' | 'frontend' | 'k8s' | 'deploy' | 'bestpractices' | 'checklist';

const sections: { id: Section; title: string; icon: string }[] = [
  { id: 'overview', title: 'Оглавление', icon: '📑' },
  { id: 'architecture', title: 'Архитектура', icon: '🏗️' },
  { id: 'backend', title: 'Backend код', icon: '⚙️' },
  { id: 'frontend', title: 'Frontend код', icon: '🎨' },
  { id: 'k8s', title: 'Kubernetes манифесты', icon: '☸️' },
  { id: 'deploy', title: 'Пошаговый деплой', icon: '🚀' },
  { id: 'bestpractices', title: 'Best Practices', icon: '✅' },
  { id: 'checklist', title: 'Чек-лист', icon: '📋' },
];

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">☸️</span> K8s Deploy Guide
          </h1>
          <p className="text-sm text-gray-400 mt-1">Task Manager Tutorial</p>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-120px)]">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setSidebarOpen(false); }}
              className={`nav-link w-full text-left flex items-center gap-2 ${activeSection === s.id ? 'active' : ''}`}
            >
              <span>{s.icon}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur border-b border-gray-800 p-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            ☰ Меню
          </button>
        </div>

        <div className="max-w-5xl mx-auto p-6 lg:p-10">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'architecture' && <ArchitectureSection />}
          {activeSection === 'backend' && <BackendSection />}
          {activeSection === 'frontend' && <FrontendSection />}
          {activeSection === 'k8s' && <K8sSection />}
          {activeSection === 'deploy' && <DeploySection />}
          {activeSection === 'bestpractices' && <BestPracticesSection />}
          {activeSection === 'checklist' && <ChecklistSection />}
        </div>
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Наверх"
        >
          ↑
        </button>
      )}
    </div>
  );
}

/* ===== OVERVIEW ===== */
function OverviewSection() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        🚀 Task Manager: от кода до Kubernetes
      </h1>
      <p className="text-lg text-gray-300 mb-8">
        Полный гайд для junior DevOps-инженера: создаём приложение и деплоим его в production-ready Kubernetes кластер.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { icon: '📐', title: 'Часть 1: Архитектура', desc: 'Стек технологий, структура проекта, 12-factor app' },
          { icon: '💻', title: 'Часть 2: Код', desc: 'Backend (Express), Frontend (React), Docker, миграции' },
          { icon: '☸️', title: 'Часть 3: Kubernetes', desc: '12 манифестов с подробными комментариями' },
          { icon: '🚀', title: 'Часть 4: Деплой', desc: 'Пошаговая инструкция с объяснениями' },
          { icon: '✅', title: 'Часть 5: Best Practices', desc: 'Что и почему мы используем' },
          { icon: '📋', title: 'Чек-лист', desc: '10 пунктов — готово к продакшену' },
        ].map((item, i) => (
          <div key={i} className="section-card hover:border-blue-500/50 transition-colors cursor-pointer"
               onClick={() => {
                 const sectionIds: Section[] = ['architecture', 'backend', 'k8s', 'deploy', 'bestpractices', 'checklist'];
                 // Find parent and navigate
               }}>
            <div className="text-2xl mb-2">{item.icon}</div>
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 section-card border-blue-500/30 bg-blue-500/5">
        <h3 className="text-lg font-semibold text-blue-300 mb-2">💡 Для кого этот гайд?</h3>
        <p className="text-gray-300">
          Для разработчиков и junior DevOps, которые хотят понять <strong>не только "как"</strong>, 
          но и <strong>"зачем"</strong> каждый компонент в Kubernetes. Каждый манифест — с объяснением, 
          каждый шаг — с обоснованием.
        </p>
      </div>

      <div className="mt-6 section-card">
        <h3 className="text-lg font-semibold text-white mb-3">🛠 Стек технологий</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'React + Vite', color: 'bg-blue-500/20 text-blue-300' },
            { name: 'TypeScript', color: 'bg-blue-600/20 text-blue-300' },
            { name: 'Express.js', color: 'bg-green-500/20 text-green-300' },
            { name: 'PostgreSQL 16', color: 'bg-indigo-500/20 text-indigo-300' },
            { name: 'Docker', color: 'bg-cyan-500/20 text-cyan-300' },
            { name: 'Kubernetes', color: 'bg-purple-500/20 text-purple-300' },
            { name: 'nginx-ingress', color: 'bg-emerald-500/20 text-emerald-300' },
            { name: 'HPA + PDB', color: 'bg-orange-500/20 text-orange-300' },
          ].map((tech, i) => (
            <span key={i} className={`badge ${tech.color} justify-center py-2`}>{tech.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== ARCHITECTURE ===== */
function ArchitectureSection() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">🏗️ Часть 1: Архитектура</h2>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">Структура проекта</h3>
        <CodeBlock language="bash" filename="Структура директорий" code={`task-manager/
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Главный компонент React
│   │   └── api.ts           # Axios-клиент для API
│   ├── public/
│   ├── nginx.conf           # Конфиг nginx (проксирование /api)
│   ├── Dockerfile           # Multi-stage: build → nginx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── index.ts         # Express server + health checks
│   │   ├── db.ts            # PostgreSQL pool
│   │   └── routes/
│   │       └── tasks.ts     # CRUD REST API
│   ├── migrations/
│   │   └── 001_create_tasks.ts
│   ├── Dockerfile           # Multi-stage: build → node:alpine
│   ├── package.json
│   └── tsconfig.json
├── k8s/                     # Kubernetes манифесты
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── configmap.yaml
│   ├── postgres-statefulset.yaml
│   ├── postgres-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── networkpolicy.yaml
│   └── pdb.yaml
├── docker-compose.yml       # Локальная разработка
├── .env.example
└── README.md`} />
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">Принципы 12-Factor App</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { n: 'I', t: 'Codebase', d: 'Один репозиторий → много деплоев' },
            { n: 'II', t: 'Dependencies', d: 'Явно объявлены (package.json), изолированы' },
            { n: 'III', t: 'Config', d: 'Всё через ENV (DB_HOST, PORT...) — не в коде' },
            { n: 'IV', t: 'Backing Services', d: 'БД = ресурс, локальная и продакшн — одинаковый код' },
            { n: 'V', t: 'Build/Release/Run', d: 'Docker multi-stage, иммутабельные образы' },
            { n: 'VI', t: 'Processes', d: 'Stateless — данные в PostgreSQL' },
            { n: 'VII', t: 'Port Binding', d: 'App сам экспортирует порт (8080)' },
            { n: 'VIII', t: 'Concurrency', d: 'Масштабируем через реплики + HPA' },
            { n: 'IX', t: 'Disposability', d: 'Graceful shutdown, fast startup' },
            { n: 'X', t: 'Dev/Prod Parity', d: 'docker-compose ≈ k8s, одинаковый стек' },
            { n: 'XI', t: 'Logs', d: 'stdout/stderr — Kubernetes собирает' },
            { n: 'XII', t: 'Admin Processes', d: 'Миграции — initContainer' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-800/50">
              <span className="text-blue-400 font-bold text-sm min-w-[28px]">{item.n}</span>
              <div>
                <span className="text-white font-medium text-sm">{item.t}</span>
                <p className="text-gray-400 text-xs mt-0.5">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card border-yellow-500/30 bg-yellow-500/5">
        <h3 className="text-lg font-semibold text-yellow-300 mb-2">⚡ Схема трафика</h3>
        <div className="font-mono text-sm text-gray-300 leading-relaxed">
          <pre>{`
  User → Ingress (nginx)
           ├── /api/*  → backend-svc:8080 → Backend Pods (×2)
           │                                    ↓
           │                              PostgreSQL (StatefulSet)
           └── /*      → frontend-svc:80  → Frontend Pods (×2)
                          (nginx → /api проксируется на backend)
          `}</pre>
        </div>
      </div>
    </div>
  );
}

/* ===== BACKEND ===== */
function BackendSection() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">⚙️ Часть 2: Backend</h2>
      <p className="text-gray-300 mb-6">
        Express + TypeScript REST API с health-check эндпоинтами для Kubernetes probes.
      </p>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 src/index.ts — главный файл</h3>
        <p className="text-sm text-gray-400 mb-3">
          Точка входа. Экспортирует <code className="text-blue-300">/healthz</code> (liveness) и <code className="text-blue-300">/readyz</code> (readiness).
          Разница: liveness — "жив ли процесс?", readiness — "готов ли принимать трафик?".
        </p>
        <CodeBlock language="typescript" filename="backend/src/index.ts" code={backendCode.indexTs} />
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 src/db.ts — подключение к PostgreSQL</h3>
        <p className="text-sm text-gray-400 mb-3">
          Connection pool. Все настройки — из переменных окружения (12-factor).
        </p>
        <CodeBlock language="typescript" filename="backend/src/db.ts" code={backendCode.dbTs} />
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 src/routes/tasks.ts — CRUD API</h3>
        <CodeBlock language="typescript" filename="backend/src/routes/tasks.ts" code={backendCode.routesTasks} />
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 Миграция — создание таблицы tasks</h3>
        <CodeBlock language="typescript" filename="backend/migrations/001_create_tasks.ts" code={backendCode.migration} />
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 Dockerfile (multi-stage, non-root)</h3>
        <p className="text-sm text-gray-400 mb-3">
          Двухэтапная сборка: сначала компилируем TypeScript, потом копируем только артефакты в минимальный образ.
          Non-root пользователь — защита от escalation атак.
        </p>
        <CodeBlock language="dockerfile" filename="backend/Dockerfile" code={backendCode.dockerfile} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="section-card">
          <h3 className="text-lg font-semibold text-white mb-3">📄 package.json</h3>
          <CodeBlock language="json" filename="backend/package.json" code={backendCode.packageJson} />
        </div>
        <div className="section-card">
          <h3 className="text-lg font-semibold text-white mb-3">📄 tsconfig.json</h3>
          <CodeBlock language="json" filename="backend/tsconfig.json" code={backendCode.tsconfig} />
        </div>
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 .env.example</h3>
        <CodeBlock language="bash" filename=".env.example" code={backendCode.envExample} />
      </div>
    </div>
  );
}

/* ===== FRONTEND ===== */
function FrontendSection() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">🎨 Часть 2: Frontend</h2>
      <p className="text-gray-300 mb-6">
        React SPA с Axios-клиентом. В Docker — nginx отдаёт статику и проксирует /api на backend.
      </p>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 src/App.tsx — главный компонент</h3>
        <CodeBlock language="tsx" filename="frontend/src/App.tsx" code={frontendCode.appTsx} />
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 src/api.ts — HTTP-клиент</h3>
        <CodeBlock language="typescript" filename="frontend/src/api.ts" code={frontendCode.api} />
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 nginx.conf — проксирование API</h3>
        <p className="text-sm text-gray-400 mb-3">
          Nginx отдаёт SPA и проксирует <code className="text-blue-300">/api/*</code> на backend.
          В Kubernetes nginx внутри пода проксирует на <code className="text-blue-300">backend-svc:8080</code>.
        </p>
        <CodeBlock language="nginx" filename="frontend/nginx.conf" code={frontendCode.nginxConf} />
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 Dockerfile (multi-stage: build → nginx)</h3>
        <p className="text-sm text-gray-400 mb-3">
          Первый этап — собираем Vite. Второй — копируем dist в nginx:alpine.
          Финальный образ ~25MB вместо ~500MB.
        </p>
        <CodeBlock language="dockerfile" filename="frontend/Dockerfile" code={frontendCode.frontendDockerfile} />
      </div>

      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3">📄 docker-compose.yml — локальная разработка</h3>
        <CodeBlock language="yaml" filename="docker-compose.yml" code={backendCode.dockerCompose} />
      </div>
    </div>
  );
}

/* ===== K8S ===== */
function K8sSection() {
  const [expanded, setExpanded] = useState<string | null>('namespace');

  const manifests = [
    { id: 'namespace', title: '1. Namespace', file: 'k8s/namespace.yaml', code: k8sManifests.namespace, desc: 'Изоляция ресурсов проекта' },
    { id: 'secrets', title: '2. Secret', file: 'k8s/secrets.yaml', code: k8sManifests.secrets, desc: 'Чувствительные данные (пароли)' },
    { id: 'configmap', title: '3. ConfigMap', file: 'k8s/configmap.yaml', code: k8sManifests.configmap, desc: 'Несекретная конфигурация' },
    { id: 'postgres-ss', title: '4. PostgreSQL StatefulSet', file: 'k8s/postgres-statefulset.yaml', code: k8sManifests.postgresStatefulSet, desc: 'StatefulSet + PVC для БД' },
    { id: 'postgres-svc', title: '5. PostgreSQL Service', file: 'k8s/postgres-service.yaml', code: k8sManifests.postgresService, desc: 'Headless + ClusterIP сервисы' },
    { id: 'backend-deploy', title: '6. Backend Deployment', file: 'k8s/backend-deployment.yaml', code: k8sManifests.backendDeployment, desc: '2 реплики, probes, security, initContainer' },
    { id: 'backend-svc', title: '7. Backend Service', file: 'k8s/backend-service.yaml', code: k8sManifests.backendService, desc: 'ClusterIP для backend' },
    { id: 'frontend-deploy', title: '8. Frontend Deployment', file: 'k8s/frontend-deployment.yaml', code: k8sManifests.frontendDeployment, desc: 'Nginx со статикой' },
    { id: 'frontend-svc', title: '9. Frontend Service', file: 'k8s/frontend-service.yaml', code: k8sManifests.frontendService, desc: 'ClusterIP для frontend' },
    { id: 'ingress', title: '10. Ingress', file: 'k8s/ingress.yaml', code: k8sManifests.ingress, desc: 'Маршрутизация / и /api' },
    { id: 'hpa', title: '11. HPA', file: 'k8s/hpa.yaml', code: k8sManifests.hpa, desc: 'Автоскейлинг по CPU' },
    { id: 'netpol', title: '12. NetworkPolicy', file: 'k8s/networkpolicy.yaml', code: k8sManifests.networkPolicy, desc: 'Zero-trust networking' },
    { id: 'pdb', title: '13. PDB', file: 'k8s/pdb.yaml', code: k8sManifests.pdb, desc: 'PodDisruptionBudget' },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">☸️ Часть 3: Kubernetes манифесты</h2>
      <p className="text-gray-300 mb-6">
        Каждый манифест — с подробными комментариями. Кликай на название, чтобы развернуть.
      </p>

      <div className="space-y-3">
        {manifests.map((m) => (
          <div key={m.id} className="section-card p-0 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === m.id ? null : m.id)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{m.title}</h3>
                <p className="text-sm text-gray-400">{m.desc}</p>
                <span className="text-xs text-gray-500 font-mono mt-1">{m.file}</span>
              </div>
              <span className="text-2xl text-gray-400">{expanded === m.id ? '−' : '+'}</span>
            </button>
            {expanded === m.id && (
              <div className="border-t border-gray-800">
                <CodeBlock language="yaml" filename={m.file} code={m.code} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== DEPLOY ===== */
function DeploySection() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">🚀 Часть 4: Пошаговый деплой</h2>
      <p className="text-gray-300 mb-8">
        Идём по шагам, как настоящий DevOps-инженер в продакшене. Каждый шаг — с объяснением <strong>зачем</strong>.
      </p>

      {/* Step 1 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
          Проверка контекста
        </h3>
        <p className="text-gray-300 mb-3">
          <strong>Зачем:</strong> Убедиться, что мы деплоим в правильный кластер. Ошибка здесь = деплой не туда.
          Это как проверить адрес перед тем, как ломать дверь.
        </p>
        <CodeBlock language="bash" code={`# Проверяем, к какому кластеру подключены
kubectl config current-context

# Смотрим ноды — все ли в статусе Ready
kubectl get nodes

# Проверяем, что у нас есть права
kubectl auth can-i create deployments -n task-manager`} />
      </div>

      {/* Step 2 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          Сборка и пуш Docker-образов
        </h3>
        <p className="text-gray-300 mb-3">
          <strong>Зачем:</strong> Kubernetes скачивает образы из registry. Нужно собрать и запушить.
          <br />⚠️ Используем <strong>иммутабельные теги</strong> (<code className="text-blue-300">:1.0.0</code>), никогда <code className="text-red-300">:latest</code>!
        </p>
        <CodeBlock language="bash" code={`# Задаём переменные
REGISTRY="your-registry.io"  # Docker Hub, GCR, ECR, etc.
VERSION="1.0.0"

# Собираем backend
docker build -t \${REGISTRY}/task-backend:\${VERSION} ./backend
docker push \${REGISTRY}/task-backend:\${VERSION}

# Собираем frontend
docker build -t \${REGISTRY}/task-frontend:\${VERSION} ./frontend
docker push \${REGISTRY}/task-frontend:\${VERSION}

# Проверяем, что образы доступны
docker pull \${REGISTRY}/task-backend:\${VERSION}`} />
      </div>

      {/* Step 3 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
          Установка Ingress Controller (nginx)
        </h3>
        <p className="text-gray-300 mb-3">
          <strong>Зачем:</strong> Ingress Controller — это "входная дверь" кластера. Без него Ingress-ресурс не работает.
          Ставим через Helm — стандарт для управления приложениями в K8s.
        </p>
        <CodeBlock language="bash" code={`# Добавляем Helm-репозиторий nginx
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Устанавливаем ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \\
  --namespace ingress-nginx \\
  --create-namespace \\
  --set controller.replicaCount=2 \\
  --set controller.nodeSelector."kubernetes\\.io/os"=linux

# Проверяем, что поды запущены
kubectl get pods -n ingress-nginx

# Получаем External IP (нужен для DNS)
kubectl get svc -n ingress-nginx`} />
      </div>

      {/* Step 4 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
          Установка metrics-server (для HPA)
        </h3>
        <p className="text-gray-300 mb-3">
          <strong>Зачем:</strong> HPA читает метрики CPU/памяти из metrics-server. Без него автоскейлинг не работает.
          В managed кластерах (EKS, GKE) обычно уже установлен.
        </p>
        <CodeBlock language="bash" code={`# Установка metrics-server
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm repo update

helm install metrics-server metrics-server/metrics-server \\
  --namespace kube-system \\
  --set args[0]="--kubelet-insecure-tls"  # для Minikube/kind

# Проверяем, что метрики собираются (подождать 1-2 минуты)
kubectl top nodes
kubectl top pods -n kube-system`} />
      </div>

      {/* Step 5 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
          Применение манифестов (по порядку!)
        </h3>
        <p className="text-gray-300 mb-3">
          <strong>Зачем:</strong> Порядок важен! Namespace → Secrets → ConfigMap → DB → App → Ingress → HPA → NetPol → PDB.
          Нельзя создать под до того, как создан namespace и secrets.
        </p>
        <CodeBlock language="bash" code={`# 1. Namespace (создаём "контейнер" для всех ресурсов)
kubectl apply -f k8s/namespace.yaml

# 2. Secrets (пароли должны быть до подов)
kubectl apply -f k8s/secrets.yaml

# 3. ConfigMap (конфигурация — до подов)
kubectl apply -f k8s/configmap.yaml

# 4. PostgreSQL StatefulSet + Service (БД должна быть готова до backend)
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# Ждём, пока БД будет Ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=database \\
  -n task-manager --timeout=120s

# 5. Backend (initContainer сам запустит миграции)
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# 6. Frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# 7. Ingress (маршрутизация)
kubectl apply -f k8s/ingress.yaml

# 8. HPA (автоскейлинг)
kubectl apply -f k8s/hpa.yaml

# 9. Network Policies (ограничение трафика)
kubectl apply -f k8s/networkpolicy.yaml

# 10. PDB (защита от disruptions)
kubectl apply -f k8s/pdb.yaml`} />
      </div>

      {/* Step 6 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
          Проверка деплоя
        </h3>
        <CodeBlock language="bash" code={`# Все ресурсы в namespace
kubectl get all -n task-manager

# Детали подов (статус, restarts, age)
kubectl get pods -n task-manager -o wide

# Логи backend (если что-то не так)
kubectl logs -n task-manager deployment/backend --tail=50

# Логи initContainer (миграции)
kubectl logs -n task-manager deployment/backend -c run-migrations

# Описание пода (events — здесь причины проблем)
kubectl describe pod -n task-manager -l app.kubernetes.io/component=backend

# Проверка HPA
kubectl get hpa -n task-manager

# Проверка Ingress
kubectl get ingress -n task-manager

# Проверка PVC (должен быть Bound)
kubectl get pvc -n task-manager`} />
      </div>

      {/* Step 7 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
          Настройка DNS / /etc/hosts
        </h3>
        <p className="text-gray-300 mb-3">
          <strong>Зачем:</strong> Ingress слушает на External IP. Нужно, чтобы домен из Ingress указывал на этот IP.
        </p>
        <CodeBlock language="bash" code={`# Получаем External IP ingress-nginx
INGRESS_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx \\
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Ingress IP: \${INGRESS_IP}"

# Для тестирования — добавляем в /etc/hosts
echo "\${INGRESS_IP} tasks.example.com" | sudo tee -a /etc/hosts

# В продакшене — создайте A-запись в DNS:
# tasks.example.com → \${INGRESS_IP}`} />
      </div>

      {/* Step 8 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">8</span>
          Тестирование
        </h3>
        <CodeBlock language="bash" code={`# Тест API — создание задачи
curl -X POST http://tasks.example.com/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Deploy to K8s", "description": "First task!"}'

# Тест API — список задач
curl http://tasks.example.com/api/tasks

# Тест API — обновление статуса
curl -X PATCH http://tasks.example.com/api/tasks/1 \\
  -H "Content-Type: application/json" \\
  -d '{"status": "done"}'

# Тест health endpoints
curl http://tasks.example.com/api/../healthz  # через backend-svc
kubectl exec -n task-manager deploy/backend -- wget -qO- http://localhost:8080/healthz

# Открыть в браузере
open http://tasks.example.com`} />
      </div>

      {/* Step 9 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">9</span>
          Типичные ошибки и их решения
        </h3>
        <div className="space-y-4">
          {[
            {
              error: 'ImagePullBackOff',
              cause: 'Образ не найден в registry или неправильный тег',
              fix: `# Проверьте имя образа и тег
kubectl describe pod <pod-name> -n task-manager | grep -A5 Events
# Убедитесь, что образ запушен:
docker images | grep task-backend
# Если приватный registry — проверьте imagePullSecrets`
            },
            {
              error: 'CrashLoopBackOff',
              cause: 'Приложение падает при старте (ошибка в коде, нет БД, неверные ENV)',
              fix: `# Смотрим логи — здесь причина
kubectl logs <pod-name> -n task-manager --previous
# Проверяем, что initContainer отработал:
kubectl logs <pod-name> -n task-manager -c run-migrations
# Проверяем ENV:
kubectl exec <pod-name> -n task-manager -- env | grep DB`
            },
            {
              error: 'Pending (PVC)',
              cause: 'Нет StorageClass или недостаточно места',
              fix: `# Проверяем PVC
kubectl describe pvc -n task-manager
# Смотрим доступные StorageClass:
kubectl get storageclass
# Если нет — создайте или укажите существующий в манифесте`
            },
            {
              error: 'Readiness probe failed',
              cause: 'Приложение не отвечает на /readyz (БД не готова, долгий старт)',
              fix: `# Увеличьте initialDelaySeconds
# Проверьте, что БД доступна из пода:
kubectl exec <backend-pod> -n task-manager -- nc -zv postgres-svc 5432
# Проверьте readiness endpoint:
kubectl exec <backend-pod> -n task-manager -- wget -qO- http://localhost:8080/readyz`
            },
          ].map((item, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-red-500/20 text-red-300">{item.error}</span>
              </div>
              <p className="text-sm text-gray-300 mb-2"><strong>Причина:</strong> {item.cause}</p>
              <CodeBlock language="bash" code={item.fix} />
            </div>
          ))}
        </div>
      </div>

      {/* Step 10 */}
      <div className="section-card">
        <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">10</span>
          Откат (Rollback)
        </h3>
        <p className="text-gray-300 mb-3">
          <strong>Зачем:</strong> Что-то пошло не так? Откатываемся к предыдущей версии за секунды.
          Это преимущество K8s — иммутабельные деплои = безопасные откаты.
        </p>
        <CodeBlock language="bash" code={`# Смотрим историю ревизий
kubectl rollout history deployment/backend -n task-manager

# Откат к предыдущей версии
kubectl rollout undo deployment/backend -n task-manager

# Откат к конкретной ревизии
kubectl rollout undo deployment/backend -n task-manager --to-revision=2

# Статус отката
kubectl rollout status deployment/backend -n task-manager

# Если нужно обновить образ (без отката)
kubectl set image deployment/backend \\
  backend=your-registry/task-backend:1.0.1 \\
  -n task-manager`} />
      </div>
    </div>
  );
}

/* ===== BEST PRACTICES ===== */
function BestPracticesSection() {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">✅ Часть 5: Best Practices</h2>
      <p className="text-gray-300 mb-8">
        Что мы используем и <strong>почему</strong>. Каждый пункт — обоснован.
      </p>

      <div className="space-y-4">
        {[
          {
            title: '🐳 Multi-stage Docker builds',
            why: 'Финальный образ содержит только артефакты сборки. Backend: ~150MB вместо ~900MB. Frontend: ~25MB вместо ~500MB.',
            detail: 'Меньше образ → быстрее пуш/пулл → меньше атакуемая поверхность (нет компилятора в продакшене).'
          },
          {
            title: '🔒 Non-root контейнеры',
            why: 'Если злоумышленник взломает приложение — он получит только права непривилегированного пользователя.',
            detail: 'runAsNonRoot: true + readOnlyRootFilesystem + drop ALL capabilities = defense in depth.'
          },
          {
            title: '📊 Resource requests/limits',
            why: 'Без requests планировщик не знает, куда поставить под. Без limits — один под может сожрать всю ноду.',
            detail: 'requests = "мне нужно минимум X". limits = "больше Y не давай". QoS класс Guaranteed (requests = limits) — приоритет при eviction.'
          },
          {
            title: '🏥 Probes: liveness vs readiness',
            why: 'Liveness — "перезапусти, если завис". Readiness — "убери из балансировки, если не готов".',
            detail: '⚠️ Частая ошибка: использовать liveness для проверки БД. Если БД временно недоступна — liveness убьёт под, хотя приложение исправно. Для БД — только readiness!'
          },
          {
            title: '🔐 Secrets ≠ ConfigMap',
            why: 'Secrets кодируются в base64 (не шифруются!), но хотя бы не видны в plain text при kubectl get.',
            detail: 'В реальности: External Secrets Operator → AWS Secrets Manager / Vault. Никогда не коммитьте secrets.yaml с реальными паролями!'
          },
          {
            title: '🛡️ Network Policies (Zero Trust)',
            why: 'По умолчанию в K8s все поды видят друг друга. NetworkPolicy — "default deny, explicit allow".',
            detail: 'Frontend → Backend → Postgres — только по нужным портам. DNS — всегда разрешаем (иначе ничего не работает).'
          },
          {
            title: '📈 HPA + PDB для HA',
            why: 'HPA масштабирует при нагрузке. PDB гарантирует, что при обновлении нод/кластера всегда есть минимум подов.',
            detail: 'Без PDB: kubectl drain может убить все поды backend одновременно → 100% downtime. С PDB: Kubernetes подождёт.'
          },
          {
            title: '🔄 GitOps (следующий шаг)',
            why: 'kubectl apply — хорошо для обучения. ArgoCD/Flux — для продакшена.',
            detail: 'GitOps: git repo = single source of truth. ArgoCD следит за изменениями в git и автоматически применяет в кластер. Audit trail, rollback через git revert.'
          },
          {
            title: '🏷️ Иммутабельные теги образов',
            why: ':latest непредсказуем. :1.0.0 — всегда один и тот же код. Откат = смена тега.',
            detail: 'Никогда не перезаписывайте тег! Если 1.0.0 сломан — выпускайте 1.0.1, а не перезаписывайте 1.0.0.'
          },
          {
            title: '📝 Structured Logging',
            why: 'Kubernetes собирает stdout/stderr. JSON-логи → легче парсить, фильтровать, отправлять в ELK/Loki.',
            detail: 'Используйте winston/pino с JSON-форматом. Добавляйте correlation ID для трассировки запросов.'
          },
        ].map((item, i) => (
          <div key={i} className="section-card">
            <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-gray-300 text-sm mb-2">{item.why}</p>
            <p className="text-gray-400 text-sm italic">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== CHECKLIST ===== */
function ChecklistSection() {
  const items = [
    { text: 'Multi-stage Dockerfile — финальный образ минимальный', done: true },
    { text: 'Non-root пользователь в контейнере (runAsNonRoot, runAsUser)', done: true },
    { text: 'readOnlyRootFilesystem + drop ALL capabilities', done: true },
    { text: 'Resource requests и limits заданы для всех контейнеров', done: true },
    { text: 'Liveness + Readiness probes на правильных эндпоинтах', done: true },
    { text: 'Secrets отделены от ConfigMap, не в git в plain text', done: true },
    { text: 'NetworkPolicy ограничивает трафик (zero-trust)', done: true },
    { text: 'HPA настроен + PDB защищает от disruptions', done: true },
    { text: 'Иммутабельные теги образов (:1.0.0, не :latest)', done: true },
    { text: 'RollingUpdate стратегия с maxUnavailable: 0', done: true },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">📋 Чек-лист: Готово к продакшену</h2>
      <p className="text-gray-300 mb-8">
        10 пунктов — проверь каждый перед деплоем в продакшен.
      </p>

      <div className="section-card">
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
              <span className="text-green-400 text-xl mt-0.5">✅</span>
              <div>
                <span className="text-gray-200">{item.text}</span>
                <span className="text-xs text-gray-500 ml-2">#{i + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card border-green-500/30 bg-green-500/5 mt-6">
        <h3 className="text-xl font-semibold text-green-300 mb-3">🎉 Поздравляю!</h3>
        <p className="text-gray-300">
          Если все 10 пунктов отмечены — ваше приложение готово к продакшену. 
          Следующие шаги для развития:
        </p>
        <ul className="mt-3 space-y-2 text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            Внедрить ArgoCD/Flux для GitOps
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            Добавить cert-manager для автоматического TLS
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            Настроить мониторинг (Prometheus + Grafana)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            Добавить CI/CD (GitHub Actions → build → push → deploy)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            Перенести БД на managed service (RDS, Cloud SQL)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            Настроить External Secrets для управления секретами
          </li>
        </ul>
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Создано с ❤️ для junior DevOps-инженеров</p>
        <p className="mt-1">Task Manager K8s Deploy Guide • 2024</p>
      </div>
    </div>
  );
}
