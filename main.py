import asyncio
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Real-Time NDSS API - Voting Mechanism Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global memory for mitigation logic (resets on each server restart)
blocked_nodes = set()
total_scrubbed = 0

# State Variables for the Voting Mechanism parameters
state = {
    "packet_size_kb": 250.0,
    "packet_count_pps": 5000,
    "entropy": 3.5,
    "threat_level": "Normal",
    "votes": {
        "packet_size": False,
        "packet_count": False,
        "entropy": False
    },
    "total_votes": 0,
    "action_taken": "None"
}

# Pre-defined Thresholds for deciding if a value casts a malicious vote
THRESHOLDS = {
    "packet_size_kb": 1000.0,   # >1000 KB = oversized anomalous payload
    "packet_count_pps": 15000,  # >15000 packets/sec = flooding (DDoS behavior)
    "entropy": 5.5              # >5.5 = high randomness (encrypted/obfuscated payloads)
}

def simulate_metrics():
    """Simulates real-time network parameter fluctuations with realistic ranges."""
    # 5% chance of a DDoS / anomalous event spike
    if random.random() < 0.05:
        # Threat spike: values intentionally exceed thresholds
        state["packet_size_kb"] = random.uniform(1100, 2000)
        state["packet_count_pps"] = random.uniform(16000, 30000)
        state["entropy"] = random.uniform(6.0, 8.0)
    else:
        # Normal fluctuation — values stay WELL BELOW thresholds
        # Packet size: normal range 100-700 KB (threshold is 1000)
        state["packet_size_kb"] = max(100, min(700, state["packet_size_kb"] + random.uniform(-30, 30)))
        # Packet count: normal range 2000-8000 PPS (threshold is 15000)
        state["packet_count_pps"] = max(2000, min(8000, state["packet_count_pps"] + random.uniform(-400, 400)))
        # Entropy: normal range 2.0-4.5 bits (threshold is 5.5)
        state["entropy"] = max(2.0, min(4.5, state["entropy"] + random.uniform(-0.3, 0.3)))

def evaluate_voting_mechanism():
    """Processes parameters using the voting logic."""
    # Cast votes based on thresholds
    v_size = state["packet_size_kb"] > THRESHOLDS["packet_size_kb"]
    v_count = state["packet_count_pps"] > THRESHOLDS["packet_count_pps"]
    v_entropy = state["entropy"] > THRESHOLDS["entropy"]
    
    state["votes"]["packet_size"] = bool(v_size)
    state["votes"]["packet_count"] = bool(v_count)
    state["votes"]["entropy"] = bool(v_entropy)
    
    total = sum([v_size, v_count, v_entropy])
    state["total_votes"] = total
    
    global total_scrubbed
    
    # Decision Logic: 2 or more votes = Malicious
    if total >= 2:
        state["threat_level"] = "Malicious (DDoS Detected)"
        state["action_taken"] = "Alert Generated & Threat Blocked"
        
        # Threat Mitigation: block IP and scrub malicious volumetric data
        fake_ip = f"192.168.{random.randint(1,255)}.{random.randint(1,255)}"
        blocked_nodes.add(fake_ip)
        total_scrubbed += int(state["packet_count_pps"])
        
    elif total == 1:
        state["threat_level"] = "Suspicious"
        state["action_taken"] = "Monitoring Closely"
    else:
        state["threat_level"] = "Normal"
        state["action_taken"] = "None"
        
    # Append the real-time active mitigation counts to the frontend state payload
    state["blocked_nodes_count"] = len(blocked_nodes)
    state["scrubbed_packets"] = total_scrubbed

async def metrics_generator():
    """Background task to continually output real-time data."""
    while True:
        simulate_metrics()
        evaluate_voting_mechanism()
        await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(metrics_generator())

@app.get("/")
def read_root():
    return {"message": "Voting Mechanism NDSS is running. Use WebSocket on /ws."}

# --- Manual Testing Endpoint ---

class ManualTestInput(BaseModel):
    packet_size: float
    packet_count: float
    entropy: float

@app.post("/api/test")
def manual_test(data: ManualTestInput):
    """Analyze user-provided packet metrics using the voting mechanism."""
    v_size = data.packet_size > THRESHOLDS["packet_size_kb"]
    v_count = data.packet_count > THRESHOLDS["packet_count_pps"]
    v_entropy = data.entropy > THRESHOLDS["entropy"]
    
    total = sum([v_size, v_count, v_entropy])
    
    if total >= 2:
        verdict = "Malicious"
        action = "Alert Generated & Threat Blocked"
    elif total == 1:
        verdict = "Suspicious"
        action = "Monitoring Closely"
    else:
        verdict = "Safe"
        action = "No action required"
    
    return {
        "verdict": verdict,
        "total_votes": total,
        "votes": {
            "packet_size": bool(v_size),
            "packet_count": bool(v_count),
            "entropy": bool(v_entropy)
        },
        "thresholds": THRESHOLDS,
        "action": action,
        "input": {
            "packet_size": data.packet_size,
            "packet_count": data.packet_count,
            "entropy": data.entropy
        }
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(state)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
