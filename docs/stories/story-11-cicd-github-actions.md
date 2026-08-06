## Objective

Automate code quality verification and test execution using GitHub Actions.

## Description

Create a continuous integration workflow that validates the backend on every push and pull request.

## Scope

### Workflow Setup

* Create a GitHub Actions workflow.
* Trigger on push and pull requests.
* Use a Node.js LTS environment.

### Automated Checks

* Install dependencies.
* Run lint.
* Run TypeScript build.
* Run the Jest integration test suite.

### Reporting

* Fail the workflow on lint errors.
* Fail the workflow on build errors.
* Fail the workflow on test failures.

### Documentation

* Document the CI workflow.
* Add status badge to the README (optional).

## Acceptance Criteria

* GitHub Actions runs automatically on push.
* GitHub Actions runs automatically on pull requests.
* Lint passes.
* Build passes.
* All tests pass.
* Workflow fails correctly when a test fails.

## Test Cases

### TC-H11-001

Verify workflow triggers on push.

### TC-H11-002

Verify workflow triggers on pull request.

### TC-H11-003

Verify lint failure causes workflow failure.

### TC-H11-004

Verify build failure causes workflow failure.

### TC-H11-005

Verify test failure causes workflow failure.

### TC-H11-006

Verify successful pipeline completes successfully.
