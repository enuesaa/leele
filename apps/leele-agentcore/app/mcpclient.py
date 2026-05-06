from mcp.client.streamable_http import streamable_http_client
from strands.tools.mcp.mcp_client import MCPClient
# from strands import tool

websearch = MCPClient(
    lambda: streamable_http_client('https://mcp.exa.ai/mcp'),
)

# @tool
# def add_numbers(a: int, b: int) -> int:
#     return a+b
