from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from sklearn.preprocessing import StandardScaler
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from typing import List, Dict
import logging
from dotenv import load_dotenv
import os
import requests
import time
import json
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QueryRequest(BaseModel):
    query: str

# Load models
scaler = joblib.load('scaler.pkl')
preprocessor = joblib.load('preprocessor.pkl')
iso_forest = joblib.load('isolation_forest_model.pkl')
svm = joblib.load('one_class_svm_model.pkl')
kmeans = joblib.load('kmeans_model.pkl')
autoencoder = load_model('autoencoder_model.h5', compile=False)
xgb_model = joblib.load('xgb_fraud_model.pkl')

# Initialize Pinecone clients with API keys from .env
faq_api_key = os.getenv("FAQ_API_KEY")
einstein_client_id = os.getenv("EINSTEIN_CLIENT_ID")
einstein_client_secret = os.getenv("EINSTEIN_CLIENT_SECRET")
einstein_token_url = os.getenv("EINSTEIN_TOKEN_URL")
einstein_api_url = os.getenv("EINSTEIN_API_URL")

faq_pc = Pinecone(api_key=faq_api_key)

# Connect to indexes
faq_index_name = "learning-buddy-faq"
faq_index = faq_pc.Index(faq_index_name)

# Load embedding model
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# FastAPI setup
app = FastAPI()

# Einstein AI token management
class EinsteinTokenManager:
    def __init__(self):
        self.access_token = None
        self.token_expiry = 0

    def get_access_token(self):
        # Check if token is still valid (expires in 30 minutes = 1800 seconds)
        if self.access_token and time.time() < self.token_expiry - 60:  # 1-minute buffer
            return self.access_token

        # Request new token
        try:
            response = requests.post(
                einstein_token_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": einstein_client_id,
                    "client_secret": einstein_client_secret
                }
            )
            response.raise_for_status()
            token_data = response.json()
            self.access_token = token_data["access_token"]
            self.token_expiry = time.time() + 1800  # Token valid for 30 minutes
            return self.access_token
        except Exception as e:
            logger.error(f"Error fetching Einstein AI token: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error fetching Einstein AI token: {str(e)}")

# Initialize token manager
einstein_token_manager = EinsteinTokenManager()

# Updated Transaction schema
class PreviousTransaction(BaseModel):
    _id: str
    senderAccountNumber: str
    receiverAccountNumber: str
    amount: float
    type: str
    location: str
    fraudPercentage: float
    deviceId: str
    createdAt: str
    updatedAt: str
    __v: int

class Transaction(BaseModel):
    # Inputs for older models
    TransactionAmount: float
    TransactionType: str
    CustomerOccupation: str
    AccountBalance: float
    DayOfWeek: str
    Hour: int
    Time_Gap: float
    Hour_of_Transaction: int
    AgeGroup: str
    Days_Since_Last_Transaction: int
    # Inputs for XGBoost model
    amount: float
    oldBalanceOrig: float
    newBalanceOrig: float
    oldBalanceDest: float
    newBalanceDest: float
    errorBalanceOrig: float
    errorBalanceDest: float
    # New inputs
    location: str
    previousTransactions: List[PreviousTransaction]

# FAQ RAG with Einstein AI endpoint
@app.post("/retrieve-faq-and-respond")
async def retrieve_faq_and_respond(request: QueryRequest):
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # Generate embedding for the query
        query_embedding = model.encode(query).tolist()

        # Query FAQ index
        query_results = faq_index.query(
            vector=query_embedding,
            top_k=3,
            include_metadata=True
        )

        # Extract FAQs with score > 0.5
        faqs = [
            {
                "question": match.metadata.get("question", "Unknown"),
                "answer": match.metadata.get("answer", "No answer"),
                "score": match.score
            }
            for match in query_results.matches
            if match.score > 0.5
        ]

        # Construct prompt for Einstein AI
        faq_context = "\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in faqs])
        prompt = f"""
        You are a helpful assistant for a fault tolerant Secure Bank Application. Use the following FAQ context to answer the user's query. 
        Strictly refrain from using the context if it is not relevant to the user's query.
        If you are unable to answer the query then simply refuse the user by answering that you do not currently have any idea related to this query and the user may connect with an SecureBank agent, on email id customer.support@securebank.com
        
        NOTE: REFRAIN FROM USING NAME OF ANY OTHER BANKING PLATFORM

        Stay very humble with the user, and try to personify yourself as a human, greeting and thanking them would help.

        FAQ Context:
        {faq_context}

        User Query: {query}

        Response:
        """

        # Get Einstein AI access token
        access_token = einstein_token_manager.get_access_token()

        # Call Einstein AI
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "x-sfdc-app-context": "EinsteinGPT",
            "x-client-feature-id": "ai-platform-models-connected-app"
        }
        payload = {
            "prompt": prompt
        }
        response = requests.post(einstein_api_url, headers=headers, json=payload)
        response.raise_for_status()
        response_data = response.json()
        response_text = response_data["generation"]["generatedText"].strip()

        return {
            "response": response_text,
            "faqs": faqs
        }

    except Exception as e:
        logger.error(f"Error in retrieve-faq-and-respond: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Predict route with updated logic
@app.post("/predict")
def predict_combined(txn: Transaction):
    try:
        # Convert to DataFrame
        unified_data = pd.DataFrame([txn.dict()])

        # ============ Old Model Features ============
        old_model_features = [
            'TransactionAmount', 'TransactionType', 'CustomerOccupation',
            'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
            'Hour of Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
        ]
        input_old = unified_data[[
            'TransactionAmount', 'TransactionType', 'CustomerOccupation',
            'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
            'Hour_of_Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
        ]]
        input_old.columns = old_model_features  # Rename for preprocessor consistency

        X_transformed = preprocessor.transform(input_old)
        X_scaled = scaler.transform(X_transformed)

        # Anomaly-based models (DBSCAN removed)
        iso_score = 1 if iso_forest.predict(X_transformed)[0] == -1 else 0
        svm_score = 1 if svm.predict(X_scaled)[0] == -1 else 0

        kmeans_label = kmeans.predict(X_scaled)
        distance = np.linalg.norm(X_scaled - kmeans.cluster_centers_[kmeans_label], axis=1)[0]
        kmeans_threshold = np.percentile(distance, 95)
        kmeans_score = 1 if distance > kmeans_threshold else 0

        reconstruction = autoencoder.predict(X_scaled, verbose=0)
        mse = np.mean(np.power(X_scaled - reconstruction, 2), axis=1)[0]
        ae_threshold = np.percentile(mse, 95)
        ae_score = 1 if mse > ae_threshold else 0

        # ============ XGBoost Model ============
        xgb_features = [
            'amount', 'oldBalanceOrig', 'newBalanceOrig',
            'oldBalanceDest', 'newBalanceDest',
            'errorBalanceOrig', 'errorBalanceDest'
        ]
        input_xgb = unified_data[xgb_features]
        xgb_prob = float(xgb_model.predict_proba(input_xgb)[0][1])

        # ============ Previous Transactions Analysis ============
        prev_txns = sorted(txn.previousTransactions, key=lambda x: x.updatedAt, reverse=True)
        time_deltas = []
        amounts = [txn.amount for txn in prev_txns]

        # Calculate time deltas
        for i in range(len(prev_txns) - 1):
            t1 = datetime.fromisoformat(prev_txns[i].updatedAt.replace('Z', '+00:00'))
            t2 = datetime.fromisoformat(prev_txns[i + 1].updatedAt.replace('Z', '+00:00'))
            delta = (t1 - t2).total_seconds() / 60  # in minutes
            time_deltas.append(delta)

        # Detect abrupt changes using z-score
        time_spike_score = 0
        if time_deltas:
            time_mean = np.mean(time_deltas)
            time_std = np.std(time_deltas) if np.std(time_deltas) > 0 else 1
            time_z_scores = [(t - time_mean) / time_std for t in time_deltas]
            time_spike_score = 1 if any(abs(z) > 3 for z in time_z_scores) else 0

        amount_spike_score = 0
        if len(amounts) > 1:
            amount_mean = np.mean(amounts)
            amount_std = np.std(amounts) if np.std(amounts) > 0 else 1
            amount_z_scores = [(a - amount_mean) / amount_std for a in amounts]
            amount_spike_score = 1 if any(abs(z) > 3 for z in amount_z_scores) else 0

        # Combined spike score (average of time and amount)
        spike_score = (time_spike_score + amount_spike_score) / 2

        # ============ Einstein AI Location Feasibility Check ============
        ai_score = 0
        if prev_txns:
            # Take last 10 transactions
            last_10_txns = prev_txns[:10]
            txn_data = [
                {
                    "location": txn.location,
                    "amount": txn.amount,
                    "timestamp": txn.updatedAt
                }
                for txn in last_10_txns
            ]
            prompt = f"""
            You are an assistant analyzing bank transactions for fraud detection. 
            Given the following list of transactions with their locations and timestamps, check if any two consecutive transactions occur at different locations.
            For each pair of consecutive transactions at different locations, evaluate if the time difference between them is feasible for travel between those locations,
            Considering typical travel speeds (e.g., car, plane). If the travel time is not feasible (e.g., too short for the distance), return 1. 
            If all pairs are feasible or no different locations are found, return 0. Output exactly one digit: 0 or 1.

            Example: trasaction 
                one is conducted at: location:Delhi timestamp: 2025-06-12T05:45:52.164Z
                second is conducted at: location Ahemdabad timestamp: 2025-06-12T05:47:52.164Z
                Now the time differnce is 2 minutes and we have an estimate that the time to reach from Ahemdabad to Delhi is 2 hours, but the differnce in time is 2 minutes
                so it would be classified as a fraud transaction, and the response would be 1
            
            Now please review the transactions below:


            Transactions:
            {json.dumps(txn_data, indent=2)}

            A STRICT INSTRUCTION: YOU CAN ONLY RESPOND USING 1 IT IT IS FRAUD 0 IF IT IS GENUINE, DO NOT GENERATE ANY SINGLE LETTER EXCEPT THAT

            Response:
            """

            # Get Einstein AI access token
            access_token = einstein_token_manager.get_access_token()

            # Call Einstein AI
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "x-sfdc-app-context": "EinsteinGPT",
                "x-client-feature-id": "ai-platform-models-connected-app"
            }
            payload = {"prompt": prompt}
            response = requests.post(einstein_api_url, headers=headers, json=payload)

            # print(payload,response)
            response.raise_for_status()
            response_data = response.json()
            # print(response_data)
            ai_response = response_data["generation"]["generatedText"].strip()
            ai_score = int(ai_response) if ai_response in ["0", "1"] else 0

        # ============ Final Fraud Percentage ============
        model_scores = [
            iso_score, svm_score, kmeans_score, ae_score, xgb_prob
        ]
        model_avg = float(np.mean(model_scores))
        fraud_percentage = (
            0.3 * model_avg +  # 40% from models
            0.3 * spike_score +  # 30% from time/amount spikes
            0.4 * ai_score  # 30% from Einstein AI
        )

        return {
            "model_scores": {
                "isolation_forest": iso_score,
                "svm": svm_score,
                "kmeans": kmeans_score,
                "autoencoder": ae_score,
                "xgboost_prob": xgb_prob
            },
            "spike_score": {
                "time_spike": time_spike_score,
                "amount_spike": amount_spike_score,
                "combined_spike": spike_score
            },
            "ai_location_score": ai_score,
            "fraud_percentage": fraud_percentage
        }

    except Exception as e:
        logger.error(f"Error in predict_combined: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")





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


# curl -X POST "https://984d-14-99-203-243.ngrok-free.app" ^
# More? -H "Content-Type: application/json" ^
# More? -d "{\"query\": \"Can you give me details about user with id 1234?\"}"   

# from fastapi import FastAPI
# from pydantic import BaseModel
# import joblib
# import numpy as np
# import pandas as pd
# from tensorflow.keras.models import load_model
# from sklearn.preprocessing import StandardScaler
# import uvicorn
# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from pinecone import Pinecone, ServerlessSpec
# from sentence_transformers import SentenceTransformer
# from typing import List, Dict
# import logging
# from dotenv import load_dotenv
# import os
# import requests
# import time
# import json

# # Load environment variables from .env file
# load_dotenv()

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# class QueryRequest(BaseModel):
#     query: str

# # Load models
# scaler = joblib.load('scaler.pkl')
# preprocessor = joblib.load('preprocessor.pkl')
# iso_forest = joblib.load('isolation_forest_model.pkl')
# svm = joblib.load('one_class_svm_model.pkl')
# kmeans = joblib.load('kmeans_model.pkl')
# dbscan = joblib.load('dbscan_model.pkl')
# autoencoder = load_model('autoencoder_model.h5', compile=False)
# xgb_model = joblib.load('xgb_fraud_model.pkl')

# # Initialize Pinecone clients with API keys from .env
# faq_api_key = os.getenv("FAQ_API_KEY")
# einstein_client_id = os.getenv("EINSTEIN_CLIENT_ID")
# einstein_client_secret = os.getenv("EINSTEIN_CLIENT_SECRET")
# einstein_token_url = os.getenv("EINSTEIN_TOKEN_URL")
# einstein_api_url = os.getenv("EINSTEIN_API_URL")

# faq_pc = Pinecone(api_key=faq_api_key)

# # Connect to indexes
# faq_index_name = "learning-buddy-faq"
# faq_index = faq_pc.Index(faq_index_name)

# # Load embedding model
# model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# # FastAPI setup
# app = FastAPI()

# # Unified input schema
# class Transaction(BaseModel):
#     # Inputs for older models
#     TransactionAmount: float
#     TransactionType: str
#     CustomerOccupation: str
#     AccountBalance: float
#     DayOfWeek: str
#     Hour: int
#     Time_Gap: float
#     Hour_of_Transaction: int
#     AgeGroup: str
#     Days_Since_Last_Transaction: int

#     # Inputs for XGBoost model
#     amount: float
#     oldBalanceOrig: float
#     newBalanceOrig: float
#     oldBalanceDest: float
#     newBalanceDest: float
#     errorBalanceOrig: float
#     errorBalanceDest: float
#     location: str
    


# # Einstein AI token management
# class EinsteinTokenManager:
#     def __init__(self):
#         self.access_token = None
#         self.token_expiry = 0

#     def get_access_token(self):
#         # Check if token is still valid (expires in 30 minutes = 1800 seconds)
#         if self.access_token and time.time() < self.token_expiry - 60:  # 1-minute buffer
#             return self.access_token

#         # Request new token
#         try:
#             response = requests.post(
#                 einstein_token_url,
#                 data={
#                     "grant_type": "client_credentials",
#                     "client_id": einstein_client_id,
#                     "client_secret": einstein_client_secret
#                 }
#             )
#             response.raise_for_status()
#             token_data = response.json()
#             self.access_token = token_data["access_token"]
#             self.token_expiry = time.time() + 1800  # Token valid for 30 minutes
#             return self.access_token
#         except Exception as e:
#             logger.error(f"Error fetching Einstein AI token: {str(e)}")
#             raise HTTPException(status_code=500, detail=f"Error fetching Einstein AI token: {str(e)}")

# # Initialize token manager
# einstein_token_manager = EinsteinTokenManager()

# # FAQ RAG with Einstein AI endpoint
# @app.post("/retrieve-faq-and-respond")
# async def retrieve_faq_and_respond(request: QueryRequest):
#     query = request.query.strip()
#     if not query:
#         raise HTTPException(status_code=400, detail="Query cannot be empty")

#     try:
#         # Generate embedding for the query
#         query_embedding = model.encode(query).tolist()

#         # Query FAQ index
#         query_results = faq_index.query(
#             vector=query_embedding,
#             top_k=3,
#             include_metadata=True
#         )

#         # Extract FAQs with score > 0.5
#         faqs = [
#             {
#                 "question": match.metadata.get("question", "Unknown"),
#                 "answer": match.metadata.get("answer", "No answer"),
#                 "score": match.score
#             }
#             for match in query_results.matches
#             if match.score > 0.5
#         ]

#         # Construct prompt for Einstein AI
#         faq_context = "\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in faqs])
#         prompt = f"""
#         You are a helpful assistant for a fault tolerant Secure Bank Application. Use the following FAQ context to answer the user's query. 
#         Strictly refrain from using the context if it is not relevant to the user's query.
#         If you are unable to answer the query then simply refuse the user by answering that you do not currently have any idea related to this query and the user may connect with an SecureBank agent, on email id customer.support@securebank.com
        
#         NOTE: REFRAIN FROM USING NAME OF ANY OTHER BANKING PLATFORM

#         Stay very humble with the user, and try to personify yourself as a human, greeting and thanking them would help.

#         FAQ Context:
#         {faq_context}

#         User Query: {query}

#         Response:
#         """

#         # Get Einstein AI access token
#         access_token = einstein_token_manager.get_access_token()

#         # Call Einstein AI
#         headers = {
#             "Authorization": f"Bearer {access_token}",
#             "Content-Type": "application/json",
#             "x-sfdc-app-context": "EinsteinGPT",
#             "x-client-feature-id": "ai-platform-models-connected-app"
#         }
#         payload = {
#             "prompt": prompt
#         }
#         response = requests.post(einstein_api_url, headers=headers, json=payload)
#         response.raise_for_status()
#         response_data = response.json()
#         response_text = response_data["generation"]["generatedText"].strip()

#         return {
#             "response": response_text,
#             "faqs": faqs
#         }

#     except Exception as e:
#         logger.error(f"Error in retrieve-faq-and-respond: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# @app.post("/predict")
# def predict_combined(txn: Transaction):
#     # Convert to DataFrame
#     unified_data = pd.DataFrame([txn.dict()])

#     # ============ Old Model Features ============
#     old_model_features = [
#         'TransactionAmount', 'TransactionType', 'CustomerOccupation',
#         'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
#         'Hour of Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
#     ]
#     input_old = unified_data[[
#         'TransactionAmount', 'TransactionType', 'CustomerOccupation',
#         'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
#         'Hour_of_Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
#     ]]
#     input_old.columns = old_model_features  # Rename for preprocessor consistency

#     X_transformed = preprocessor.transform(input_old)
#     X_scaled = scaler.transform(X_transformed)

#     # Anomaly-based models
#     iso_score = 1 if iso_forest.predict(X_transformed)[0] == -1 else 0
#     svm_score = 1 if svm.predict(X_scaled)[0] == -1 else 0
#     dbscan_label = dbscan.fit_predict(X_scaled)[0]
#     dbscan_score = 1 if dbscan_label == -1 else 0

#     kmeans_label = kmeans.predict(X_scaled)
#     distance = np.linalg.norm(X_scaled - kmeans.cluster_centers_[kmeans_label], axis=1)[0]
#     kmeans_threshold = np.percentile(distance, 95)
#     kmeans_score = 1 if distance > kmeans_threshold else 0

#     reconstruction = autoencoder.predict(X_scaled)
#     mse = np.mean(np.power(X_scaled - reconstruction, 2), axis=1)[0]
#     ae_threshold = np.percentile(mse, 95)
#     ae_score = 1 if mse > ae_threshold else 0

#     amount=txn.TransactionAmount

#     # ============ XGBoost Model ============
#     xgb_features = [
#         'amount', 'oldBalanceOrig', 'newBalanceOrig',
#         'oldBalanceDest', 'newBalanceDest',
#         'errorBalanceOrig', 'errorBalanceDest'
#     ]
#     input_xgb = unified_data[xgb_features]
#     xgb_prob = float(xgb_model.predict_proba(input_xgb)[0][1])

#     # ============ Final Risk Score ============
#     model_scores = [
#         iso_score, svm_score, dbscan_score,
#         kmeans_score, ae_score, xgb_prob
#     ]
#     risk_score = float(np.mean(model_scores))  # Between 0 and 1

#     return {
#         "model_scores": {
#             "isolation_forest": iso_score,
#             "svm": svm_score,
#             "dbscan": dbscan_score,
#             "kmeans": kmeans_score,
#             "autoencoder": ae_score,
#             "xgboost_prob": xgb_prob
#         },
#         "risk_score": risk_score
#     }    



# @app.post("/debug_preprocess")
# def debug_preprocessing(txn: Transaction):
#     unified_data = pd.DataFrame([txn.dict()])

#     old_model_features = [
#         'TransactionAmount', 'TransactionType', 'CustomerOccupation',
#         'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
#         'Hour of Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
#     ]

#     input_old = unified_data[[
#         'TransactionAmount', 'TransactionType', 'CustomerOccupation',
#         'AccountBalance', 'DayOfWeek', 'Hour', 'Time_Gap',
#         'Hour_of_Transaction', 'AgeGroup', 'Days_Since_Last_Transaction'
#     ]]
#     input_old.columns = old_model_features

#     try:
#         X_transformed = preprocessor.transform(input_old)
#         X_scaled = scaler.transform(X_transformed)

#         # Extract the OneHotEncoder from the 'cat' transformer
#         ohe = None
#         cat_columns = []
#         for name, transformer, cols in preprocessor.transformers_:
#             if name == "cat":
#                 ohe = transformer
#                 cat_columns = cols
#                 break

#         agegroup_encoded = None
#         if ohe and "AgeGroup" in cat_columns:
#             # Prepare full categorical row
#             cat_input = input_old[cat_columns]
#             encoded_cat = ohe.transform(cat_input)
#             encoded_cat_array = encoded_cat.toarray()[0]

#             # Find the AgeGroup encoding portion
#             agegroup_index = cat_columns.index("AgeGroup")
#             categories = ohe.categories_[agegroup_index]
#             offset = sum(len(c) for c in ohe.categories_[:agegroup_index])
#             length = len(categories)

#             agegroup_encoded = encoded_cat_array[offset:offset+length].tolist()

#         return {
#             "preprocessed_shape": X_transformed.shape,
#             "scaled_shape": X_scaled.shape,
#             "sample_preprocessed_row": X_transformed[0].tolist(),
#             "sample_scaled_row": X_scaled[0].tolist(),
#             "agegroup_encoded": agegroup_encoded
#         }

#     except Exception as e:
#         return {"error": str(e)}