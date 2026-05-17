from mcp.client.streamable_http import streamable_http_client
from strands.tools.mcp.mcp_client import MCPClient

websearch = MCPClient(
    lambda: streamable_http_client('https://mcp.exa.ai/mcp'),
)
