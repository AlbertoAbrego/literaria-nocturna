# Story 25 — Build, Types & Repository Hygiene

## Objective

Remove technical debt, unnecessary artifacts, and configuration inconsistencies so the repository is clean and maintainable.

---

## Scope

### 1. Backend Build

Review TypeScript build configuration to prevent unnecessary inclusion of:

- Tests
- Development scripts
- Development-only code

Evaluate:

- `tsconfig.build.json`
- `exclude` configuration
- Build scripts

---

### 2. Frontend Types

- Remove duplicate `Book` definitions.
- Use the shared `Genre` type consistently.
- Correct frontend typing inconsistencies.
- Review the project's strict TypeScript configuration.
- Align TypeScript configuration with project conventions and documentation.

---

### 3. Coverage Artifacts

- Remove unnecessary generated artifacts such as `cov.txt`, `cov2.txt`, and other generated coverage dumps.
- Configure ESLint to ignore the `coverage/` directory.

---

### 4. Package Metadata

Review and correct:

- `"main": "index.js"` if it does not represent the actual package entry point.

---

### 5. Minor Cleanup

Review and resolve:

- `BookForm.handleSuccess`
- Unnecessary comments
- Dead code
- Small cleanup items identified during the audit

---

## Acceptance Criteria

- Backend build generates only necessary artifacts.
- No coverage dumps are committed.
- ESLint does not analyze generated coverage files.
- Frontend types are consistent.
- Package metadata accurately represents the project.
- No ESLint warnings remain related to generated artifacts.
- Build, lint, type checking, and tests pass.

---

## Related Audit Findings

- **H-06**
- **M-01**
- **M-11**
- **L-01**
- **L-05**
