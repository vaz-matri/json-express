const express = require('express');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError,
} = require('@modelcontextprotocol/sdk/types.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample data store
let todos = [
    { id: 1, task: 'Learn MCP', completed: false },
    { id: 2, task: 'Build standalone server', completed: false },
];

// Create MCP server instance
const mcpServer = new Server(
    {
        name: 'standalone-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Set up MCP tools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_todos',
                description: 'Get all todos',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'create_todo',
                description: 'Create a new todo',
                inputSchema: {
                    type: 'object',
                    properties: {
                        task: { type: 'string', description: 'Task description' },
                    },
                    required: ['task'],
                },
            },
            {
                name: 'update_todo',
                description: 'Update a todo',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'number', description: 'Todo ID' },
                        task: { type: 'string', description: 'Updated task' },
                        completed: { type: 'boolean', description: 'Completion status' },
                    },
                    required: ['id'],
                },
            },
        ],
    };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
        case 'get_todos':
            return {
                content: [{ type: 'text', text: JSON.stringify(todos, null, 2) }],
            };

        case 'create_todo':
            const newTodo = {
                id: todos.length + 1,
                task: args.task,
                completed: false,
            };
            todos.push(newTodo);
            return {
                content: [{ type: 'text', text: `Created: ${JSON.stringify(newTodo)}` }],
            };

        case 'update_todo':
            const todo = todos.find(t => t.id === args.id);
            if (!todo) {
                throw new McpError(ErrorCode.InvalidRequest, 'Todo not found');
            }
            if (args.task !== undefined) todo.task = args.task;
            if (args.completed !== undefined) todo.completed = args.completed;
            return {
                content: [{ type: 'text', text: `Updated: ${JSON.stringify(todo)}` }],
            };

        default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
});

// Express routes for testing MCP functionality via HTTP
app.get('/', (req, res) => {
    res.json({
        message: 'Standalone MCP Server',
        endpoints: {
            '/mcp/tools': 'GET - List available MCP tools',
            '/mcp/call': 'POST - Call an MCP tool',
            '/api/todos': 'GET - Regular REST endpoint',
        }
    });
});

// Endpoint to list MCP tools
app.get('/mcp/tools', async (req, res) => {
    try {
        const result = await mcpServer.requestHandlers.get('tools/list')({
            method: 'tools/list',
            params: {},
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to call MCP tools
app.post('/mcp/call', async (req, res) => {
    try {
        const { name, arguments: args } = req.body;
        const result = await mcpServer.requestHandlers.get('tools/call')({
            method: 'tools/call',
            params: { name, arguments: args || {} },
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Regular REST endpoints for comparison
app.get('/api/todos', (req, res) => {
    res.json(todos);
});

app.post('/api/todos', (req, res) => {
    const { task } = req.body;
    const newTodo = {
        id: todos.length + 1,
        task,
        completed: false,
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// Test client simulation
app.get('/test', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MCP Server Test Client</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
        button { padding: 10px; margin: 5px; cursor: pointer; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
        input { padding: 5px; margin: 5px; }
      </style>
    </head>
    <body>
      <h1>MCP Server Test Client</h1>
      
      <div class="section">
        <h2>MCP Tools</h2>
        <button onclick="listTools()">List Available Tools</button>
        <button onclick="getTodos()">Get Todos (MCP)</button>
        <input type="text" id="newTask" placeholder="Enter task">
        <button onclick="createTodo()">Create Todo (MCP)</button>
        <pre id="mcpResult"></pre>
      </div>

      <div class="section">
        <h2>REST API (for comparison)</h2>
        <button onclick="getRestTodos()">Get Todos (REST)</button>
        <pre id="restResult"></pre>
      </div>

      <script>
        async function listTools() {
          const response = await fetch('/mcp/tools')
          const result = await response.json()
          document.getElementById('mcpResult').textContent = JSON.stringify(result, null, 2)
        }

        async function getTodos() {
          const response = await fetch('/mcp/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'get_todos' })
          })
          const result = await response.json()
          document.getElementById('mcpResult').textContent = JSON.stringify(result, null, 2)
        }

        async function createTodo() {
          const task = document.getElementById('newTask').value
          if (!task) return
          
          const response = await fetch('/mcp/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: 'create_todo', 
              arguments: { task } 
            })
          })
          const result = await response.json()
          document.getElementById('mcpResult').textContent = JSON.stringify(result, null, 2)
          document.getElementById('newTask').value = ''
        }

        async function getRestTodos() {
          const response = await fetch('/api/todos')
          const result = await response.json()
          document.getElementById('restResult').textContent = JSON.stringify(result, null, 2)
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
    console.log(`🚀 Standalone MCP Server running on http://localhost:${PORT}`);
    console.log(`📝 Test interface available at http://localhost:${PORT}/test`);
    console.log(`🔧 MCP tools endpoint: http://localhost:${PORT}/mcp/tools`);
    console.log(`⚡ Call MCP tools: POST http://localhost:${PORT}/mcp/call`);
});

// Export for testing
module.exports = { app, mcpServer };
