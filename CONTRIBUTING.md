# Contributing to Zemo

Thank you for your interest in contributing to Zemo. This project is created and maintained solo by Mohammed Sahil. This document outlines the local development workflows, architectural layout, code conventions, and pull request procedures.

---

## 1. Development Environment Prerequisites

Ensure the following runtimes and services are available on your host system:

* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: v6.0 or higher (local instance or MongoDB Atlas cluster connection URI)
* **Docker** (optional): For containerized verification

---

## 2. Local Setup and Installation

### 2.1 Clone the Repository

```bash
git clone https://github.com/imMohammedSahil/Zemo.git
cd Zemo
```

### 2.2 Environment Configuration

Copy the example configuration to initialize root and environment variables:

```bash
cp .env.example .env
```

Ensure all required connection strings and API keys are populated:
* `PORT`: Server listen port (default `5000`)
* `MONGO_URI`: Valid MongoDB connection string
* `GEMINI_API_KEY`: API key for generative AI services
* `JWT_SECRET`: Secret key for session/token verification

### 2.3 Dependency Installation

Install dependencies for both backend and frontend workspaces:

```bash
# Root and backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

---

## 3. Running the Application

### Backend Development Server

```bash
# From workspace root
npm run dev
# or
node backend/server.js
```

### Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend application runs on `http://localhost:5173` (or configured Vite port) and proxies API requests to the backend server at `http://localhost:5000`.

---

## 4. Architecture and Codebase Structure

* `backend/`: Express.js application, REST API controllers, MongoDB models, background automation, and price extraction engines.
* `backend/services/`: Core business logic including seeding (`seedService.js`), scrapers, AI summarizers, and cache handlers.
* `backend/automation/`: Scheduled cron jobs and worker tasks for price history polling.
* `frontend/`: React single-page application built with Vite and Tailwind CSS.
* `frontend/src/pages/`: Route-level container components.
* `frontend/src/components/`: Reusable interface primitives and data visualizers.

---

## 5. Branching Model and Git Workflow

### 5.1 Branch Naming Conventions

Branch names must follow structured prefixes:

* `feat/<feature-name>`: Implementation of new functionality
* `fix/<bug-name>`: Defect fixes
* `perf/<scope>`: Performance optimizations
* `refactor/<scope>`: Code changes that neither fix a bug nor add a feature
* `docs/<scope>`: Documentation updates

### 5.2 Commit Message Format

Commit messages must adhere to the Conventional Commits specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

Examples:
* `feat(seed): add auto-seed mechanism for showcase demo product in production`
* `fix(extractor): handle null price selectors on dynamic dom changes`
* `perf(cache): implement memory-backed caching layer for price history queries`

---

## 6. Code Style and Quality Standards

* **Linting & Formatting**: Maintain existing code style. Indentation is 2 spaces. Semicolons are required.
* **Error Handling**: Use structured `try/catch` blocks in asynchronous Express route handlers. Do not swallow exceptions silently; log meaningful diagnostic information.
* **Non-blocking Operations**: Avoid synchronous blocking I/O calls (`fs.readFileSync`, `fs.writeFileSync`) in critical request paths unless executing initialization routines.
* **Secrets Management**: Never commit credentials, `.env` files, or production secrets to source control.

---

## 7. Submitting a Pull Request

1. Ensure the feature branch is rebased onto the latest `main` branch.
2. Verify that both the backend server and frontend application build cleanly without syntax errors or broken dependencies.
3. Push changes to your fork:
   ```bash
   git push origin feat/<feature-name>
   ```
4. Open a Pull Request targeting `main`.
5. Provide a detailed summary in the PR description:
   * **Problem**: What issue does this PR address?
   * **Solution**: Technical summary of modifications.
   * **Verification**: Steps taken to test and validate the behavior.

