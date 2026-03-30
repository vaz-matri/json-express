# @json-express/cli

The official Command Line Interface and Auto-Discovery engine for [JSON Express](https://github.com/vaz-matri/json-express).

The CLI is responsible for booting the framework. It acts as the "glue" that detects which plugins you have installed, wires them up to the Microkernel, resolves configuration conflicts, and starts your server.

## 📦 Installation

**Global (For quick prototyping):**
```bash
npm install -g @json-express/cli
```

**Local (For custom/production setups):**
```bash
npm install @json-express/cli -D
```

## 🚀 Usage

Navigate to a folder containing `.json` files and run:
```bash
npx json-express
```

### Auto-Discovery & Conflict Resolution
The CLI scans your `package.json` for any `@json-express/*` plugins.
- If it finds `@json-express/transport-fastify`, it automatically replaces the default Express server.
- If it finds *multiple* plugins of the same category, it pauses the boot sequence and presents an interactive terminal prompt to ask you which one to use!
