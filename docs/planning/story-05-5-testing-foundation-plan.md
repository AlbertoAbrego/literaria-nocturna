# Plan de Implementación - Story 5.5: Testing Foundation

## Resumen
Establecer la infraestructura de testing para el backend con Jest + Supertest + MongoDB Memory Server, cubriendo integración de endpoints de las historias 1-5.

---

## Fase 1: Dependencias y Configuración Base

### 1.1 Instalar dependencias de testing
```bash
npm install -D jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server
```

**Dependencias:**
- `jest` - Test runner
- `@types/jest` - Types para Jest
- `ts-jest` - Preprocesador TypeScript para Jest
- `supertest` - HTTP assertions para testing de API
- `@types/supertest` - Types para Supertest
- `mongodb-memory-server` - MongoDB en memoria para tests aislados

### 1.2 Configurar `jest.config.js`
```javascript
// backend/jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  globalSetup: '<rootDir>/src/test/globalSetup.ts',
  globalTeardown: '<rootDir>/src/test/globalTeardown.ts',
  testTimeout: 10000,
  verbose: true
};
```

### 1.3 Configurar `tsconfig.json` para tests (si necesario)
Verificar que `tsconfig.json` incluya `"esModuleInterop": true` y `"experimentalDecorators": true` para mongodb-memory-server.

---

## Fase 2: Infraestructura de Base de Datos de Testing

### 2.1 Global Setup (`src/test/globalSetup.ts`)
- Iniciar MongoDB Memory Server
- Establecer `process.env.MONGODB_URI` con la URI en memoria
- Exportar la instancia para uso en teardown

### 2.2 Global Teardown (`src/test/globalTeardown.ts`)
- Detener MongoDB Memory Server
- Limpiar recursos

### 2.3 Test Setup (`src/test/setup.ts`)
- `beforeAll`: Conectar a la BD de testing (usar Mongoose.connect con URI de memory server)
- `afterAll`: Desconectar Mongoose
- `beforeEach`: Limpiar colecciones (Book) para aislamiento
- Configurar timeouts globales

---

## Fase 3: Utilidades y Helpers de Testing

### 3.1 `src/test/helpers/database.ts`
```typescript
// Helpers para limpiar/seedear BD
export async function clearDatabase(): Promise<void>
export async function seedBooks(books: Partial<Book>[]): Promise<Book[]>
```

### 3.2 `src/test/helpers/request.ts`
```typescript
// Wrapper de Supertest con app configurada
import request from 'supertest';
import app from '../../app';

export const testRequest = request(app);
```

### 3.3 `src/test/helpers/factories.ts`
```typescript
// Factories para crear datos de prueba
export function createBookDto(overrides?: Partial<CreateBookDto>): CreateBookDto
export function createBookModel(overrides?: Partial<Book>): Book
```

### 3.4 `src/test/helpers/assertions.ts`
```typescript
// Custom matchers/assertions
export function expectValidationError(response: Response, field: string): void
export function expectConflictError(response: Response): void
export function expectNotFoundError(response: Response): void
```

---

## Fase 4: Scripts NPM

Actualizar `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## Fase 5: Tests de Integración (Historias 1-5)

### Estructura de archivos:
```
src/
└── test/
    ├── globalSetup.ts
    ├── globalTeardown.ts
    ├── setup.ts
    ├── helpers/
    |   ├── database.ts
    |   ├── request.ts
    |   ├── factories.ts
    |   └── assertions.ts
    └── integration/
        ├── health.integration.test.ts
        ├── books.create.integration.test.ts
        ├── books.list.integration.test.ts
        └── books.getById.integration.test.ts
```

### 5.1 Health Check (`health.integration.test.ts`)
- **TC-H1-001**: GET /api/health → 200 OK

### 5.2 Books - Create (`books.create.integration.test.ts`)
- **TC-H2-001**: POST /api/books válido → 201 Created
- **TC-H2-008**: POST /api/books duplicado (title + author) → 409 Conflict
- **TC-H2-002**: POST /api/books sin title → 400 Bad Request

### 5.3 Books - List (`books.list.integration.test.ts`)
- **TC-H4-001**: GET /api/books → 200 OK con array de libros
- **TC-H4-002**: GET /api/books sin libros → 200 OK con array vacío

### 5.4 Books - Get by ID (`books.getById.integration.test.ts`)
- **TC-H5-001**: GET /api/books/:id existente → 200 OK
- **TC-H5-003**: GET /api/books/:id ObjectId válido inexistente → 404 Not Found

---

## Fase 6: Documentación

### 6.1 Crear `docs/testing.md`
Contenido:
- Estrategia de testing (integración vs unitarios)
- Cómo ejecutar tests
- Estructura de tests
- Helpers disponibles
- Convenciones de naming
- CI/CD integration
- Troubleshooting común

---

## Orden de Ejecución Recomendado

| Paso | Descripción | Archivos Afectados |
|------|-------------|-------------------|
| 1 | Instalar dependencias | package.json |
| 2 | Configurar Jest | jest.config.js |
| 3 | Global setup/teardown | src/test/globalSetup.ts, globalTeardown.ts |
| 4 | Test setup (beforeAll/afterAll/beforeEach) | src/test/setup.ts |
| 5 | Helpers de BD, request, factories, assertions | src/test/helpers/*.ts |
| 6 | Tests de integración Health | src/modules/health/health.integration.test.ts |
| 7 | Tests de integración Books Create | src/modules/books/books.create.integration.test.ts |
| 8 | Tests de integración Books List | src/modules/books/books.list.integration.test.ts |
| 9 | Tests de integración Books GetById | src/modules/books/books.getById.integration.test.ts |
| 10 | Scripts npm | package.json |
| 11 | Documentación | docs/testing.md |
| 12 | Verificación completa | `npm test` y `npm run test:coverage` |

---

## Criterios de Aceptación (Verificación)

- [ ] `npm test` ejecuta sin errores
- [ ] `npm run test:coverage` genera reporte
- [ ] Tests corren en aislamiento (orden no importa)
- [ ] BD se crea y limpia automáticamente
- [ ] 8 tests de integración pasan (TC-H1-001, TC-H2-001, TC-H2-008, TC-H2-002, TC-H4-001, TC-H4-002, TC-H5-001, TC-H5-003)
- [ ] Documentación en docs/testing.md completa

---

## Consideraciones Técnicas

### MongoDB Memory Server
- Ventaja: Aislamiento total, no requiere BD externa
- Trade-off: Más lento que mock, pero tests son reales
- Configuración: `replSet` para transacciones si se necesitan

### TypeScript + Jest
- Usar `ts-jest` preset
- `moduleResolution: node` en tsconfig
- `isolatedModules: true`

### Supertest
- Importar `app` directamente (no server.ts)
- No llamar `app.listen()` en tests
- Usar `request(app)` para cada test o helper compartido

### Aislamiento
- `beforeEach`: `await Book.deleteMany({})`
- No compartir estado entre tests
- Cada test crea sus propios datos via factories