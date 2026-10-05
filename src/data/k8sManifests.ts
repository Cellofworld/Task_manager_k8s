export const k8sManifests = {
  namespace: `# ============================================
# Namespace — изолируем ресурсы приложения
# ============================================
# Зачем: каждый проект в своём namespace. Это даёт:
# - изоляцию RBAC (права можно назначать на namespace)
# - изоляцию NetworkPolicy
# - удобство: kubectl get all -n task-manager
apiVersion: v1
kind: Namespace
metadata:
  name: task-manager
  labels:
    app.kubernetes.io/name: task-manager
    app.kubernetes.io/part-of: task-manager`,

  secrets: `# ============================================
# Secret — чувствительные данные (пароли, ключи)
# ============================================
# ⚠️  ВНИМАНИЕ: В продакшене НЕ используйте stringData в git!
# Используйте один из вариантов:
# - External Secrets Operator (из AWS Secrets Manager / Vault)
# - Sealed Secrets (Bitnami) — шифрование через kubeseal
# - HashiCorp Vault с CSI driver
#
# Здесь stringData для удобства — Kubernetes сам закодирует в base64
apiVersion: v1
kind: Secret
metadata:
  name: postgres-credentials
  namespace: task-manager
  labels:
    app.kubernetes.io/component: database
type: Opaque
stringData:
  POSTGRES_USER: "taskmanager"
  POSTGRES_PASSWORD: "S3cur3P@ssw0rd!"  # В реальности — из Vault/ExternalSecrets
  POSTGRES_DB: "taskmanager"`,

  configmap: `# ============================================
# ConfigMap — несекретная конфигурация
# ============================================
# Зачем: отделяем конфигурацию от кода (12-factor app, принцип III)
# Меняем без пересборки образа
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: task-manager
  labels:
    app.kubernetes.io/component: backend
data:
  # Настройки подключения к БД
  DB_HOST: "postgres-svc"       # headless service для StatefulSet
  DB_PORT: "5432"
  DB_NAME: "taskmanager"
  # Настройки приложения
  PORT: "8080"
  NODE_ENV: "production"
  LOG_LEVEL: "info"`,

  postgresStatefulSet: `# ============================================
# StatefulSet для PostgreSQL
# ============================================
# Почему StatefulSet, а не Deployment?
# 1. Стабильные имена подов: postgres-0, postgres-1 (важно для кластера)
# 2. Гарантированный порядок запуска/остановки
# 3. PersistentVolume привязывается к конкретному поду (не "переезжает")
# 4. Для БД критична идентичность — каждый инстанс уникален
#
# Deployment перемешивает поды при обновлении — для stateless-приложений ОК,
# но для БД каждый инстанс должен знать "кто я"
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: task-manager
  labels:
    app.kubernetes.io/component: database
spec:
  serviceName: postgres-headless  # headless service (clusterIP: None)
  replicas: 1                     # для production БД — лучше managed service (RDS, Cloud SQL)
  selector:
    matchLabels:
      app.kubernetes.io/component: database
  template:
    metadata:
      labels:
        app.kubernetes.io/component: database
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
              name: postgres
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_PASSWORD
            - name: POSTGRES_DB
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_DB
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 512Mi
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          # Readiness probe — проверяем, что БД принимает подключения
          readinessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - $(POSTGRES_USER)
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            exec:
              command:
                - pg_isready
                - -U
                - $(POSTGRES_USER)
            initialDelaySeconds: 15
            periodSeconds: 20
  # VolumeClaimTemplate — каждый под получает свой PVC
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: standard  # замените на ваш StorageClass
        resources:
          requests:
            storage: 10Gi`,

  postgresService: `# ============================================
# Headless Service для StatefulSet
# ============================================
# clusterIP: None — не балансирует, а возвращает DNS-записи всех подов
# Это нужно StatefulSet для стабильных DNS-имен:
# postgres-0.postgres-headless.task-manager.svc.cluster.local
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
  namespace: task-manager
  labels:
    app.kubernetes.io/component: database
spec:
  clusterIP: None  # headless!
  ports:
    - port: 5432
      targetPort: 5432
      name: postgres
  selector:
    app.kubernetes.io/component: database
---
# Обычный ClusterIP Service — для подключения backend к БД
apiVersion: v1
kind: Service
metadata:
  name: postgres-svc
  namespace: task-manager
  labels:
    app.kubernetes.io/component: database
spec:
  type: ClusterIP
  ports:
    - port: 5432
      targetPort: 5432
      name: postgres
  selector:
    app.kubernetes.io/component: database`,

  backendDeployment: `# ============================================
# Backend Deployment
# ============================================
# Ключевые элементы production-ready деплоя:
# 1. 2 реплики — отказоустойчивость
# 2. Probes — Kubernetes знает, когда под "жив" и готов принимать трафик
# 3. Resources — гарантируем ресурсы и ограничиваем аппетиты
# 4. SecurityContext — минимальные привилегии (принцип least privilege)
# 5. InitContainer — ждём БД и запускаем миграции
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: task-manager
  labels:
    app.kubernetes.io/component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app.kubernetes.io/component: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # при обновлении — +1 под
      maxUnavailable: 0    # 0 — ни одного пода не должно быть недоступно
  template:
    metadata:
      labels:
        app.kubernetes.io/component: backend
    spec:
      # InitContainer: ждём БД и запускаем миграции
      initContainers:
        - name: wait-for-db
          image: busybox:1.36
          command: ['sh', '-c', 'until nc -z postgres-svc 5432; do echo waiting for db; sleep 2; done']
        - name: run-migrations
          image: your-registry/task-backend:1.0.0  # тот же образ, что и основной
          command: ['npx', 'node-pg-migrate', 'up']
          env:
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: backend-config
                  key: DB_HOST
            - name: DB_PORT
              valueFrom:
                configMapKeyRef:
                  name: backend-config
                  key: DB_PORT
            - name: DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: backend-config
                  key: DB_NAME
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_USER
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_PASSWORD
      containers:
        - name: backend
          image: your-registry/task-backend:1.0.0
          # ⚠️ НИКОГДА не используйте :latest в продакшене!
          # Иммутабельные теги = предсказуемые откаты
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080
              name: http
          env:
            - name: PORT
              valueFrom:
                configMapKeyRef:
                  name: backend-config
                  key: PORT
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: backend-config
                  key: DB_HOST
            - name: DB_PORT
              valueFrom:
                configMapKeyRef:
                  name: backend-config
                  key: DB_PORT
            - name: DB_NAME
              valueFrom:
                configMapKeyRef:
                  name: backend-config
                  key: DB_NAME
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_USER
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: POSTGRES_PASSWORD
          # === LIVENESS PROBE ===
          # "Жив ли контейнер?" Если провал — Kubernetes ПЕРЕЗАПУСКАЕТ под
          # Используйте для обнаружения deadlock'ов, утечек памяти
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 15
            failureThreshold: 3
            timeoutSeconds: 3
          # === READINESS PROBE ===
          # "Готов ли под принимать трафик?" Если провал — убирают из Service
          # НЕ перезапускает под! Просто не шлёт трафик
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            failureThreshold: 3
            timeoutSeconds: 3
          # === STARTUP PROBE ===
          # Для медленных приложений — даёт время на старт
          # Пока не пройдёт — liveness/readiness не проверяются
          startupProbe:
            httpGet:
              path: /healthz
              port: 8080
            failureThreshold: 30
            periodSeconds: 2
          # === RESOURCES ===
          # requests — гарантированный минимум (планировщик учитывает при размещении)
          # limits — максимум, после которого под будет убит (OOMKilled для памяти)
          resources:
            requests:
              cpu: 100m        # 0.1 ядра — минимум для старта
              memory: 128Mi    # 128 МБ — минимум
            limits:
              cpu: 500m        # 0.5 ядра — максимум
              memory: 256Mi    # 256 МБ — больше не дадим
          # === SECURITY CONTEXT ===
          # Принцип минимальных привилегий
          securityContext:
            runAsNonRoot: true          # не root!
            runAsUser: 1001             # конкретный UID
            readOnlyRootFilesystem: true # ФС только для чтения
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL                   # убираем все Linux capabilities
      # Дополнительная защита на уровне пода
      securityContext:
        fsGroup: 1001`,

  backendService: `# ============================================
# Backend Service (ClusterIP)
# ============================================
# ClusterIP — доступен только внутри кластера
# Ingress будет маршрутизировать /api → этот сервис
apiVersion: v1
kind: Service
metadata:
  name: backend-svc
  namespace: task-manager
  labels:
    app.kubernetes.io/component: backend
spec:
  type: ClusterIP
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
      name: http
  selector:
    app.kubernetes.io/component: backend`,

  frontendDeployment: `# ============================================
# Frontend Deployment
# ============================================
# Nginx со статикой — лёгкий, быстрый, не требует Node.js
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: task-manager
  labels:
    app.kubernetes.io/component: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app.kubernetes.io/component: frontend
  template:
    metadata:
      labels:
        app.kubernetes.io/component: frontend
    spec:
      containers:
        - name: frontend
          image: your-registry/task-frontend:1.0.0
          ports:
            - containerPort: 80
              name: http
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 128Mi
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 3
            periodSeconds: 10
          securityContext:
            runAsNonRoot: true
            runAsUser: 101   # nginx user
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL`,

  frontendService: `apiVersion: v1
kind: Service
metadata:
  name: frontend-svc
  namespace: task-manager
  labels:
    app.kubernetes.io/component: frontend
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
      name: http
  selector:
    app.kubernetes.io/component: frontend`,

  ingress: `# ============================================
# Ingress — точка входа из внешнего мира
# ============================================
# nginx-ingress маршрутизирует:
# / → frontend (SPA)
# /api → backend (REST API)
#
# Для TLS — раскомментируйте секцию tls и используйте cert-manager
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: task-manager-ingress
  namespace: task-manager
  labels:
    app.kubernetes.io/name: task-manager
  annotations:
    # Аннотации для nginx-ingress-controller
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    # Rate limiting (защита от DDoS)
    nginx.ingress.kubernetes.io/limit-rps: "10"
spec:
  ingressClassName: nginx
  # TLS — раскомментируйте для HTTPS
  # tls:
  #   - hosts:
  #       - tasks.example.com
  #     secretName: task-manager-tls
  rules:
    - host: tasks.example.com  # замените на ваш домен
      http:
        paths:
          # API → backend
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend-svc
                port:
                  number: 8080
          # Всё остальное → frontend
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-svc
                port:
                  number: 80`,

  hpa: `# ============================================
# Horizontal Pod Autoscaler
# ============================================
# Автоматически масштабирует backend от 2 до 10 подов
# при загрузке CPU > 70%
#
# Требует: metrics-server в кластере
# helm install metrics-server metrics-server/metrics-server -n kube-system
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: task-manager
  labels:
    app.kubernetes.io/component: backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    # Можно добавить память:
    # - type: Resource
    #   resource:
    #     name: memory
    #     target:
    #       type: Utilization
    #       averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # ждём 60 сек перед масштабированием вверх
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60            # максимум +2 пода в минуту
    scaleDown:
      stabilizationWindowSeconds: 300  # ждём 5 мин перед уменьшением (защита от flapping)
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120           # максимум -1 под за 2 минуты`,

  networkPolicy: `# ============================================
# Network Policies — Zero Trust networking
# ============================================
# По умолчанию в Kubernetes ВСЕ поды могут общаться друг с другом.
# NetworkPolicy меняет это: если есть хотя бы один policy для пода —
# всё, что явно не разрешено, ЗАПРЕЩЕНО.
#
# Наша политика:
# 1. Backend принимает трафик ТОЛЬКО от frontend
# 2. Backend может обращаться ТОЛЬКО к postgres
# 3. Frontend принимает трафик ТОЛЬКО от ingress
---
# Backend: входящий — только от frontend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-ingress
  namespace: task-manager
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/component: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        # Разрешаем от frontend
        - podSelector:
            matchLabels:
              app.kubernetes.io/component: frontend
        # И от ingress controller (в namespace ingress-nginx)
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
---
# Backend: исходящий — только к postgres и DNS
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-egress
  namespace: task-manager
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/component: backend
  policyTypes:
    - Egress
  egress:
    # К PostgreSQL
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/component: database
      ports:
        - protocol: TCP
          port: 5432
    # DNS (обязательно! иначе поды не смогут резолвить имена)
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
---
# Frontend: входящий — только от ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-ingress
  namespace: task-manager
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/component: frontend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 80`,

  pdb: `# ============================================
# Pod Disruption Budget
# ============================================
# Гарантирует, что при voluntary disruptions
# (drain node, cluster upgrade, rollout)
# всегда будет минимум 1 работающий под.
#
# Без PDB: kubectl drain может убить все поды сразу → downtime
# С PDB: Kubernetes подождёт, пока не будет безопасно
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
  namespace: task-manager
  labels:
    app.kubernetes.io/component: backend
spec:
  minAvailable: 1  # минимум 1 под всегда доступен
  selector:
    matchLabels:
      app.kubernetes.io/component: backend`,
};
