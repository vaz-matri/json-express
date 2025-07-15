// test-mcp.js
const axios = require('axios')

const BASE_URL = 'http://localhost:3000'

async function testMCPServer() {
    console.log('🧪 Testing Standalone MCP Server\n')

    try {
        // 1. List available tools
        console.log('1. Listing available MCP tools...')
        const toolsResponse = await axios.get(`${BASE_URL}/mcp/tools`)
        console.log('Available tools:', toolsResponse.data.tools.map(t => t.name))
        console.log('')

        // 2. Get all todos
        console.log('2. Getting all todos via MCP...')
        const todosResponse = await axios.post(`${BASE_URL}/mcp/call`, {
            name: 'get_todos'
        })
        console.log('Todos:', todosResponse.data.content[0].text)
        console.log('')

        // 3. Create a new todo
        console.log('3. Creating a new todo via MCP...')
        const createResponse = await axios.post(`${BASE_URL}/mcp/call`, {
            name: 'create_todo',
            arguments: { task: 'Test MCP integration' }
        })
        console.log('Created:', createResponse.data.content[0].text)
        console.log('')

        // 4. Update a todo
        console.log('4. Updating todo via MCP...')
        const updateResponse = await axios.post(`${BASE_URL}/mcp/call`, {
            name: 'update_todo',
            arguments: { id: 1, completed: true }
        })
        console.log('Updated:', updateResponse.data.content[0].text)
        console.log('')

        // 5. Get updated todos
        console.log('5. Getting updated todos...')
        const updatedTodos = await axios.post(`${BASE_URL}/mcp/call`, {
            name: 'get_todos'
        })
        console.log('Updated todos:', updatedTodos.data.content[0].text)
        console.log('')

        // 6. Compare with REST API
        console.log('6. Comparing with REST API...')
        const restResponse = await axios.get(`${BASE_URL}/api/todos`)
        console.log('REST API result:', JSON.stringify(restResponse.data, null, 2))
        console.log('')

        console.log('✅ All tests completed successfully!')

    } catch (error) {
        console.error('❌ Test failed:', error.message)
        if (error.response) {
            console.error('Response data:', error.response.data)
        }
    }
}

// Run the test
if (require.main === module) {
    testMCPServer()
}

module.exports = { testMCPServer }
