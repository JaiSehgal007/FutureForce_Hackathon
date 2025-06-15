import os
import requests
import json
import time
import uuid
from typing import TypedDict, Annotated, Sequence, Optional, Dict

from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage, AnyMessage
from langchain_core.tools import tool
from langchain_core.runnables import Runnable, RunnableConfig, RunnableLambda
from langgraph.graph import StateGraph, END, START
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph.message import add_messages
from dotenv import load_dotenv

# --- 0. Load Environment Variables & Setup ---

# For this to work, create a .env file in the same directory
# with the following keys.
#
# .env.example
# EINSTEIN_CLIENT_ID="your_client_id"
# EINSTEIN_CLIENT_SECRET="your_client_secret"
# EINSTEIN_TOKEN_URL="https://your.einstein.token.url/..."
# EINSTEIN_API_URL="https://your.einstein.api.url/..."
# BASE_URL="http://localhost:5000/api/v1/admin" # Your Node.js backend

load_dotenv()

# This is the base URL for your running Node.js backend.
BASE_URL = os.getenv("BASE_URL", "http://localhost:5000/api/v1/admin")

# --- 1. Define Tool Schemas and Functions ---
# This section remains unchanged. The tools define the capabilities of your agent.

class GetStatsByRegionArgs(BaseModel):
    """Input schema for the get_stats_by_region tool."""
    region: str = Field(..., description="The region to get statistics for (e.g., 'North', 'South').")

@tool(args_schema=GetStatsByRegionArgs)
def get_stats_by_region(region: str) -> dict:
    """
    Fetches statistics for a specific region by hitting the /stats/region endpoint.
    """
    print(f"--- Calling Tool: get_stats_by_region with region: {region} ---")
    try:
        response = requests.get(
            f"{BASE_URL}/stats/region",
            json={"region": region},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {e}", "details": str(e.response.text if e.response else "No response")}

class GetStatsByUserArgs(BaseModel):
    """Input schema for the get_stats_by_user tool."""
    user_id: str = Field(..., description="The unique identifier of the user.")

@tool(args_schema=GetStatsByUserArgs)
def get_stats_by_user(user_id: str) -> dict:
    """
    Fetches statistics for a specific user by ID by hitting the /stats/user/:id endpoint.
    """
    print(f"--- Calling Tool: get_stats_by_user with user_id: {user_id} ---")
    try:
        response = requests.get(f"{BASE_URL}/stats/user/{user_id}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {e}", "details": str(e.response.text if e.response else "No response")}

class RegisterEmployeeArgs(BaseModel):
    """Input schema for the register_employee tool."""
    name: str = Field(..., description="The full name of the employee.")
    email: str = Field(..., description="The email address of the employee.")
    contact: str = Field(..., description="The contact number of the employee.")
    pin: str = Field(..., description="A numeric PIN for the employee.")

@tool(args_schema=RegisterEmployeeArgs)
def register_employee(name: str, email: str, contact: str, pin: str) -> dict:
    """
    Registers a new employee by hitting the /register-employee endpoint.
    """
    print(f"--- Calling Tool: register_employee with data: name={name}, email={email} ---")
    try:
        payload = {"name": name, "email": email, "contact": contact, "pin": pin}
        response = requests.post(
            f"{BASE_URL}/register-employee",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {e}", "details": str(e.response.text if e.response else "No response")}

# List of tools available to the agent
tools = [get_stats_by_region, get_stats_by_user, register_employee]

# --- 2. Define Graph State ---
# The state manages the flow of messages and errors within the graph.
class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    error: Optional[str]

# --- 3. Define Einstein AI LLM Integration as a Runnable ---
# This section manages authentication and interaction with the Einstein AI model.

class EinsteinTokenManager:
    """Manages fetching and caching of the Einstein AI access token using a Singleton pattern."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EinsteinTokenManager, cls).__new__(cls)
            cls._instance.access_token: Optional[str] = None
            cls._instance.token_expiry: float = 0.0
            cls._instance.client_id = os.getenv("EINSTEIN_CLIENT_ID")
            cls._instance.client_secret = os.getenv("EINSTEIN_CLIENT_SECRET")
            cls._instance.token_url = os.getenv("EINSTEIN_TOKEN_URL")
            if not all([cls._instance.client_id, cls._instance.client_secret, cls._instance.token_url]):
                raise ValueError("EINSTEIN_CLIENT_ID, EINSTEIN_CLIENT_SECRET, and EINSTEIN_TOKEN_URL must be set in the .env file")
        return cls._instance

    def get_access_token(self) -> str:
        """Fetches a new token if the current one is expired or non-existent."""
        if self.access_token and time.time() < self.token_expiry - 60:  # 60-second buffer
            return self.access_token

        print("--- Fetching new Einstein AI access token ---")
        try:
            response = requests.post(
                self.token_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                }
            )
            response.raise_for_status()
            token_data = response.json()
            self.access_token = token_data["access_token"]
            self.token_expiry = time.time() + 1800  # Token is valid for 30 minutes
            print("--- Successfully fetched new token ---")
            return self.access_token
        except Exception as e:
            print(f"Error fetching Einstein AI token: {str(e)}")
            raise

class EinsteinRunnable(Runnable):
    """A custom runnable that invokes the Einstein AI model and parses its response."""

    def invoke(self, state: State, config: Optional[RunnableConfig] = None) -> BaseMessage:
        print("--- Calling Custom Einstein AI Runnable ---")
        
        api_url = os.getenv("EINSTEIN_API_URL")
        if not api_url:
            raise ValueError("EINSTEIN_API_URL must be set in the .env file")
            
        token_manager = EinsteinTokenManager()
        
        prompt_text = self._create_einstein_prompt(state['messages'], tools)
        
        try:
            access_token = token_manager.get_access_token()
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                # *** ADDED: Required headers for the Einstein API call ***
                "x-sfdc-app-context": "EinsteinGPT",
                "x-client-feature-id": "ai-platform-models-connected-app"
            }
            payload = {"prompt": prompt_text}

            print("--- Sending prompt to Einstein AI ---")
            response = requests.post(api_url, headers=headers, json=payload)
            response.raise_for_status()
            response_data = response.json()
            
            response_text = response_data.get("generation", {}).get("generatedText", "").strip()

            return self._parse_einstein_response(response_text)

        except Exception as e:
            print(f"Error calling Einstein AI model: {e}")
            # Pass the actual error message for better debugging
            return AIMessage(content=f"Sorry, I encountered an error: {e}")

    def _create_einstein_prompt(self, messages: Sequence[BaseMessage], tools_list: list) -> str:
        """Creates a comprehensive prompt for the Einstein AI model, including tool definitions."""
        tool_defs_str = "\n".join([json.dumps(t.get_input_schema().model_json_schema()) for t in tools_list])
        
        system_prompt = f"""You are a helpful assistant. Your goal is to assist users by calling tools on their behalf.
Based on the user's query and the conversation history, decide if a tool is needed.
- If a tool is appropriate, you MUST respond with ONLY a single JSON object with two keys: 'name' and 'args'.
  'name' must be one of the available tool names.
  'args' must be an object containing the required parameters for that tool.
- If the last message was a ToolMessage containing data, your job is to summarize the result for the user in a clear and helpful way.
- If no tool is needed and you are not summarizing a tool result, respond in natural language.

Available Tools:
{tool_defs_str}

Conversation History:"""
        history = "\n".join([f"{msg.__class__.__name__}: {msg.content}" for msg in messages])
        return f"{system_prompt}\n{history}\n\nUser Query: {messages[-1].content}\nResponse:"

    def _parse_einstein_response(self, response_text: str) -> AIMessage:
        """Parses the model's response to be either a tool call or a text message."""
        try:
            tool_call_data = json.loads(response_text)
            tool_name = tool_call_data.get("name")
            tool_args = tool_call_data.get("args")

            if tool_name and isinstance(tool_args, dict):
                print(f"--- Einstein AI requested tool: {tool_name} with args: {tool_args} ---")
                return AIMessage(
                    content="",
                    tool_calls=[{
                        "id": f"tool_{uuid.uuid4()}",
                        "name": tool_name,
                        "args": tool_args,
                    }]
                )
            else:
                return AIMessage(content=response_text)
        except json.JSONDecodeError:
            print("--- Einstein AI responded with text ---")
            return AIMessage(content=response_text)


# --- 4. Define Graph Nodes ---
# These nodes form the structure of our agent's logic.

class Assistant:
    """The assistant node, which invokes the Einstein AI model."""
    def __init__(self, runnable: Runnable):
        self.runnable = runnable

    def __call__(self, state: State, config: RunnableConfig):
        result = self.runnable.invoke(state)
        return {"messages": [result]}

def handle_tool_error(state: State) -> dict:
    """A fallback node for handling tool execution errors gracefully."""
    error = state.get("error")
    print(f"--- Tool Execution Error: {error} ---")
    last_message = state["messages"][-1]
    
    tool_call_id = ""
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        tool_call_id = last_message.tool_calls[0]['id']

    return {
        "messages": [
            ToolMessage(
                content=f"Error: {repr(error)}\n. Please review your input and try again.",
                tool_call_id=tool_call_id,
            )
        ]
    }

# Instantiate the primary nodes for the graph
assistant_runnable = EinsteinRunnable()
tool_node = ToolNode(tools).with_fallbacks(
    [RunnableLambda(handle_tool_error)], exception_key="error"
)

# --- 5. Construct the Graph ---
# This defines the control flow of the agent.

graph_builder = StateGraph(State)

graph_builder.add_node("assistant", Assistant(assistant_runnable))
graph_builder.add_node("tools", tool_node)

graph_builder.add_edge(START, "assistant")
graph_builder.add_conditional_edges(
    "assistant",
    tools_condition,
    {
        "tools": "tools",
        END: END
    },
)
graph_builder.add_edge("tools", "assistant")

# Compile the graph into a runnable application
langgraph_app = graph_builder.compile()


# --- 6. FastAPI Application Setup ---
# This section exposes the LangGraph agent via an API.

api = FastAPI(
    title="LangGraph Agent with Einstein AI",
    description="An API to interact with a conversational agent that can use tools.",
    version="1.0.0"
)

# In-memory store for conversation histories.
# For production, consider a more persistent store like Redis.
conversation_histories: Dict[str, list[AnyMessage]] = {}

class QueryRequest(BaseModel):
    """The request body for the /invoke endpoint."""
    query: str = Field(..., description="The user's query to the agent.")
    session_id: Optional[str] = Field(None, description="A unique ID to maintain conversation state.")

class QueryResponse(BaseModel):
    """The response body for the /invoke endpoint."""
    response: str
    session_id: str

@api.post("/invoke", response_model=QueryResponse)
async def invoke_agent(request: QueryRequest = Body(...)):
    """
    Receives a user query, processes it through the LangGraph agent, and returns the final response.
    """
    print(f"\n{'='*50}")
    print(f"🚀 Received query: '{request.query}' for session: {request.session_id}")
    print(f"{'='*50}")

    session_id = request.session_id or str(uuid.uuid4())
    
    # Retrieve existing history or start a new one
    messages = conversation_histories.get(session_id, [])
    
    # Add the new user query to the history
    messages.append(HumanMessage(content=request.query))
    
    config = {"recursion_limit": 10}
    initial_state = {"messages": messages}
    
    try:
        # Invoke the graph to get the final state
        final_state = langgraph_app.invoke(initial_state, config=config)
        
        # The final response is the last message in the state
        final_response_message = final_state["messages"][-1]
        response_content = final_response_message.content if final_response_message.content else "Conversation ended with a tool call."

        # Save the updated history
        conversation_histories[session_id] = final_state["messages"]

        print(f"\n✅ Final Response for session {session_id}:")
        print(response_content)
        print(f"{'='*50}\n")
        
        return QueryResponse(response=response_content, session_id=session_id)

    except Exception as e:
        print(f"--- An unexpected error occurred: {e} ---")
        raise HTTPException(status_code=500, detail=str(e))


@api.get("/")
def read_root():
    return {"message": "Welcome to the LangGraph Agent API. Send POST requests to /invoke."}


