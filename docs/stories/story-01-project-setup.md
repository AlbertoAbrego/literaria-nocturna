### **Objective**

Create base backend project.

### **Endpoint**

`GET /api/health endpoint`

### **Acceptance criteria:**

- Node.js + Typescript configured
- Express configured
- ESLint and Prettier configured
- Create initial base structure of the project (routes, controllers, services, models, middleware, dto, config)
- Configure dev and build projects

### **Test Cases**

Health Check

- TC-H1-001 – GET /api/health returns 200 OK.
- TC-H1-002 – Response contains status, message, version, and timestamp.
- TC-H1-003 – Root endpoint (GET /) returns the API welcome message.
