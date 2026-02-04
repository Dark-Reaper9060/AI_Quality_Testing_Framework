import json
import time
import json
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from ..GenAI_SHAP.Scoring_Pipeline import scoring_pipeline

class ProxyMonitorMiddleware(BaseHTTPMiddleware):

    allowed_paths = {"/chatbot"}
    

    async def dispatch(self, request: Request, call_next):
        
        if request.url.path not in self.allowed_paths:
            return await call_next(request)
        
        start_time = time.time()

        # ---- 1. Read request body ----
        # We must read it now to print it
        body_bytes = await request.body()
        
        # ---- 2. RE-INJECT body so downstream handlers can read it ----
        # We define a new receive function that returns the bytes we just read
        async def receive():
            return {"type": "http.request", "body": body_bytes, "more_body": False}
        
        # We override the request's internal receive method
        request._receive = receive

        # Decode for printing (handling potential failures)
        try:
            request_body = body_bytes.decode("utf-8")
        except:
            request_body = "<binary data>"
            
        query_params = dict(request.query_params) or {}
        
        path_params = request.path_params or ""

        

        print("----- INCOMING REQUEST -----")
        # print("Path:", request.url.path)
        # print("Method:", request.method)
        # print("Request Body:", request_body)
        # print("Query Params:", query_params)
        # print("Path Params:", path_params)

        # ---- Call actual endpoint ----
        response = await call_next(request)

        # ---- Read response body ----
        # NOTE: This loads the full response into memory. 
        # Be careful with large file downloads!
        response_body = b""
        async for chunk in response.body_iterator:
            response_body += chunk

        response_text = response_body.decode("utf-8")

        print("----- OUTGOING RESPONSE -----")
        # print("Status Code:", response.status_code)
        # print("Response Body:", response_text)
        # print("Latency:", round(time.time() - start_time, 4), "seconds")

        print("")
        print("")
        print("")
        
        
        content_type = response.headers.get("content-type", "")

        parsed_response = None
        
        print("Contetnt:  ", content_type)

        if "application/json" in content_type.lower() and response_text.strip():
            try:
                parsed_response = json.loads(response_text)
            except json.JSONDecodeError as e:
                parsed_response = None

        if isinstance(parsed_response, dict) and "response" in parsed_response:
            scores = scoring_pipeline.fetch_score(parsed_response["response"])
            
            print(scores)
            
                    
                
        

        # ---- Return response again ----
        return Response(
            content=response_body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type
        )