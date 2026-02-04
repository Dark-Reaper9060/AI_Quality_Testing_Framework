from ..Model import AIQTF_DB as sys_db
from ..Auth import auth as auth
from ..LLM_Model import testcase_gen as tgen
from ..Bade_Papa.GenAI_SHAP.Scoring_Pipeline import scoring_pipeline as evaluate

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, BinaryIO, Any
from typing_extensions import Annotated
from datetime import datetime, date

import numpy as np

import requests

import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router=auth.router, prefix="/auth" )


class Test_Scenario(BaseModel):

    name: str = Field(..., min_length=1, max_length=100, description="Scenario name")
    description: str = Field(..., min_length=1, max_length=100, description="description")
    agent_name: str = Field(..., min_length=1, max_length=100, description="agent name")
    agent_endpoint: str = Field(..., min_length=1, max_length=100, description="agent endpoint")
    agent_model: str = Field(..., min_length=1, max_length=100, description="agent model")
    created_at: date = Field(None, description="Created Date")
    tags: List[str] = Field(..., min_length=1, max_length=100, description="Scenario tags")
    dimensions: List[str] = Field(..., min_length=1, max_length=100, description="Scenario selected dimensions")
    benchmark: List[float] = Field(..., min_length=1, max_length=100, description="Scenario validation benchmark")
    analysis_scores: List[float] = Field(..., min_length=1, max_length=100, description="Scores")
    overall_score : float = Field(..., min_length=1, max_length=100, description="Overall scored score")
    
    
class Test_Suit(BaseModel):
    
    name: str = Field(..., min_length=1, max_length=100, description="Test Suit name")
    description: str = Field(..., min_length=1, max_length=100, description="description")
    jira_link: str = Field(..., min_length=1, max_length=100, description="jira link")
    test_dimensions: List[str] = Field(..., min_length=1, max_length=100, description="list of test dimension")
    type: str = Field(..., min_length=1, max_length=100, description="test type")
    created_at: date = Field(None, description="Created Date")
    selected_test_cases: List[str] = Field(..., min_length=1, max_length=100, description="Selected testcases")
    
class AgentModelBase(BaseModel):
    
    model_provider: str = Field(
        ..., 
        description="The provider of the AI model (e.g., OpenAI, Anthropic, etc.)"
    )
    model_name: str = Field(
        ..., 
        description="The specific name of the model (e.g., gpt-4-turbo, claude-3-opus)"
    )
    api_version: str = Field(
        ..., 
        description="The API version to use for this model"
    )
    api_endpoint: str = Field(
        ..., 
        description="The API endpoint URL for the model provider"
    )
    api_key: str = Field(
        ..., 
        description="The API key for authentication with the model provider"
    )
    description: str = Field(
        ..., 
        description="A description of what this model configuration is for"
    )


# Scenario Endpoints
@app.post("/scenarios/", tags=["Scenarios"])
def create_scenario(
    name: str,
    description: str,
    agent_name: str,
    agent_endpoint: str,
    agent_model: str,
    tags: Optional[List[str]] = None,
    benchmark: Optional[List[float]] = None,
    dimensions:Optional[List[str]] = None,
    analysis_score:Optional[List[float]] = None,
    overall_score:Optional[float] = None
    
):
    """
    Create a new scenario
    """
    try:
        scenario_id = sys_db.insert_scenario(
            name=name,
            description=description,
            agent_name=agent_name,
            agent_endpoint=agent_endpoint,
            agent_model=agent_model,
            tags=tags,
            benchmark=benchmark,
            dimensions=dimensions,
            analysis_score=analysis_score,
            overall_score=overall_score
            
        )
        return {
            "message": "Scenario created successfully",
            "scenario_id": scenario_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating scenario: {str(e)}")

@app.get("/scenarios/", tags=["Scenarios"])
def get_all_scenarios():
    """
    Get all scenarios
    """
    try:
        result = sys_db.fetch_all_scenarios()
        scenarios_list = []
        for row in result:
            scenario = {
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "agent_name": row.agent_name,
                "agent_endpoint": row.agent_endpoint,
                "agent_model": row.agent_model,
                "created_at": str(row.created_at) if row.created_at else None,
                "tags": row.tags,
                "benchmark": row.benchmark
            }
            scenarios_list.append(scenario)
        return {
            "scenarios": scenarios_list,
            "count": len(scenarios_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scenarios: {str(e)}")

@app.get("/scenarios/{scenario_id}", tags=["Scenarios"])
def get_scenario_by_id(scenario_id: int, scenario_name: Optional[str] = None):
    """
    Get scenario by ID with optional name filter
    """
    try:
        result = sys_db.fetch_scenario_by_id(scenario_id, scenario_name)
        if result is None:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        scenario = {
            "id": result.id,
            "name": result.name,
            "description": result.description,
            "agent_name": result.agent_name,
            "agent_endpoint": result.agent_endpoint,
            "agent_model": result.agent_model,
            "created_at": str(result.created_at) if result.created_at else None,
            "tags": result.tags,
            "benchmark": result.benchmark
        }
        return {"scenario": scenario}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scenario: {str(e)}")

# Test Suit Endpoints
@app.post("/test-suits/", tags=["Test Suits"])
def create_test_suit(
    scenario_id: int,
    name: str,
    description: str,
    jira_link: Optional[str] = None,
    test_dimensions: Optional[List[str]] = None,
    selected_test_cases: Optional[List[str]] = None,
    type: str = "Automated"
):
    """
    Create a new test suit
    """
    try:
        test_suit_id = sys_db.insert_test_suit(
            scenario_id=scenario_id,
            name=name,
            description=description,
            jira_link=jira_link,
            test_dimensions=test_dimensions,
            selected_test_cases=selected_test_cases,
            type=type
        )
        return {
            "message": "Test suit created successfully",
            "test_suit_id": test_suit_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating test suit: {str(e)}")

@app.get("/test-suits/", tags=["Test Suits"])
def get_all_test_suits():
    """
    Get all test suits
    """
    try:
        result = sys_db.fetch_all_test_suits()
        test_suits_list = []
        for row in result:
            test_suit = {
                "id": row.id,
                "scenario_id": row.scenario_id,
                "name": row.name,
                "description": row.description,
                "jira_link": row.jira_link,
                "test_dimensions": row.test_dimensions,
                "created_at": str(row.created_at) if row.created_at else None,
                "selected_test_cases": row.selected_test_cases,
                "type": row.type
            }
            test_suits_list.append(test_suit)
        return {
            "test_suits": test_suits_list,
            "count": len(test_suits_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching test suits: {str(e)}")

@app.get("/test-suits/scenario/{scenario_id}", tags=["Test Suits"])
def get_test_suits_by_scenario(scenario_id: int):
    """
    Get all test suits for a specific scenario
    """
    try:
        result = sys_db.fetch_test_suits_by_scenario(scenario_id)
        test_suits_list = []
        for row in result:
            test_suit = {
                "id": row.id,
                "scenario_id": row.scenario_id,
                "name": row.name,
                "description": row.description,
                "jira_link": row.jira_link,
                "test_dimensions": row.test_dimensions,
                "created_at": str(row.created_at) if row.created_at else None,
                "document": row.document,
                "type": row.type
            }
            test_suits_list.append(test_suit)
        return {
            "test_suits": test_suits_list,
            "count": len(test_suits_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching test suits: {str(e)}")

@app.post("/test-suits/{test_suit_id}", tags=["Test Suits"])
def get_test_suit_by_id(test_suit_id: int):
    """
    Get test suit by ID
    """
    try:
        result = sys_db.fetch_test_suit_by_id(test_suit_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Test suit not found")
        
        test_suit = {
            "id": result.id,
            "scenario_id": result.scenario_id,
            "name": result.name,
            "description": result.description,
            "jira_link": result.jira_link,
            "test_dimensions": result.test_dimensions,
            "created_at": str(result.created_at) if result.created_at else None,
            "document": result.document,
            "type": result.type
        }
        return {"test_suit": test_suit}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching test suit: {str(e)}")

@app.delete("/test-suit/delete/{test_suit_id}", tags=["Test Suits"])
def delete_test_suit(test_suit_id:int):
    
    try:
        
        result = sys_db.delete_test_suit(test_suit_id)
        
        return {
            "response": "Test Suit Deleted."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching test suit: {str(e)}")
        

# Agent Endpoints
@app.post("/agents/", tags=["Agents"])
def create_agent(agent : AgentModelBase):
    """
    Create a new agent configuration
    """
    try:
        agent_id = sys_db.insert_agent(
            model_provider=agent.model_provider,
            model_name=agent.model_name,
            api_version=agent.api_version,
            api_endpoint=agent.api_endpoint,
            api_key=agent.api_key,
            description=agent.description
        )
        return {
            "message": "Agent created successfully",
            "agent_id": agent_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating agent: {str(e)}")

@app.get("/agents/", tags=["Agents"])
def get_all_agents():
    """
    Get all agent configurations
    """
    try:
        result = sys_db.fetch_all_agents()
        agents_list = []
        for row in result:
            agent = {
                "id": row.id,
                "model_provider": row.model_provider,
                "model_name": row.model_name,
                "api_version": row.api_version,
                "api_endpoint": row.api_endpoint,
                "api_key": row.api_key,
                "description": row.description
            }
            agents_list.append(agent)
        return {
            "agents": agents_list,
            "count": len(agents_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching model: {str(e)}")

@app.post("/agent/", tags=["Agents"])
def get_agent_by_id(id):
    try:
        model = sys_db.fetch_agent_by_id(id)
        if(model):
            agent = {
                "id": model.id,
                "model_provider": model.model_provider,
                "model_name": model.model_name,
                "api_version": model.api_version,
                "api_endpoint": model.api_endpoint,
                "api_key": model.api_key,
                "description": model.description
            }
        else:
            raise HTTPException(status_code=404, detail=f"Model not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching model: {str(e)}")
        

@app.delete("/agents/", tags=["Agents"])
def delete_agent(id):
    try:
        model = sys_db.fetch_agent_by_id(id) 
        
        if(model):
            sys_db.delete_selected_agent(id)
            return {
                "response": "Model Deleted",
                "model": model.model_name +" ( "+ model.model_provider + " )"
            }
        else:
            raise HTTPException(status_code=404, detail=f"Model not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching model: {str(e)}")
    
    
def get_client_bot_response(test_case:str):
    
    url = "http://127.0.0.1:8448/response"
    params = {"input": f"{test_case}"}

    response = requests.post(url, params=params)


    response_to_json = response.json()
    out_response = response_to_json["message"]

    return out_response

# Evaluation
@app.post("/evaluation/", tags=["Agent Evaluation"])
async def run_evaluation( request: Request ):
    
    content_type = request.headers.get("Content-Type", "")
    
    print("content: ", content_type)
    try:
        
        if "multipart/form-data" in content_type:
            form = await request.form()
            file = form.get("csv_file")
            
            workflow_raw = form.get("workflow", "{}")
            workflow = json.loads(workflow_raw) if isinstance(workflow_raw, str) else workflow_raw
            print("Response: ",type(workflow))
            
            step1 = workflow["step1"]
            test_description = step1["description"]
            
            # print(test_description)
            # print(type(test_description))
            
            step2 = workflow["step2"]
            
            new_testcase = []
            
            for itest in step2:
                selected_testcases = itest["selectedTestCases"] if itest["selectedTestCases"] != [] else None
                new_testcase.extend(selected_testcases)
            
            test_dimensions_list = ""
            step3 = workflow["step3"]
            for i in step3:
                test_dimensions_list += i["dimension"] + ","
            
            
        elif "application/json" in content_type:
            
            form = await request.json()
            workflow = form
            
            print("New: ", type(workflow))
            print("Test: ", workflow)
            
            step1 = workflow.get("step1")
            
            test_description = step1.get("description")
            
            step2 = workflow.get("step2")
            
            for itest in step2:
                selected_testcases = itest.get("selectedTestCases") if itest.get("selectedTestCases") != [] else None      

            test_dimensions_list = ""
            step3 = workflow.get("step3")
            for i in step3:
                test_dimensions_list += i.get("dimension") + ","
        
         
            
        response = tgen.generate_testcases(test_description, test_dimensions_list, selected_testcases)
        
        # print("Response: ", response)
        
        
        try:
            test_accuracy = response["Accuracy"] if response["Accuracy"] != None else ""
        except Exception as e:
            test_accuracy = ""
            
        
        try:
            test_Biasness = response["Bias"] if response["Bias"] != None else ""
        except Exception as e:
            test_Biasness = ""
            
            
        try:
            test_Resilience = response["Resilience"] if response["Resilience"] != None else ""
        except Exception as e:
            test_Resilience = ""
            
            
        try:
            test_Robustness = response["Robustness"] if response["Robustness"] != None else ""
        except Exception as e:
            test_Robustness = ""
            
        
        test_cases = []
        test_cases.append(test_accuracy.split(","))
        test_cases.append(test_Biasness.split(","))
        test_cases.append(test_Resilience.split(","))
        test_cases.append(test_Robustness.split(","))
        
        out_list = []
        
        print("Test_Accuracy: ", test_accuracy)
        
        for test in test_cases:
            print("TestCase_Prompt: ", test)
            bot_response = get_client_bot_response(test)
            print("bot_Response: ", bot_response)
            score = evaluate.fetch_score(bot_response)
            out_list.append(score)
            
        out_response = {}
        
        averages = {k: round(np.mean([d[k] for d in out_list]), 3) for k in out_list[0]}

        metrics_for_overall = ['Robustness', 'Biasness', 'Resilience', 'Accuracy']
        
        overall_score = round(np.mean([averages[m] for m in metrics_for_overall]), 3)

        out_response = {
            "scores": averages,
            "overall_score": overall_score
        }
        
        
        print("Score_response: ", out_list)
            
        workflow.update(out_response)
        
        return workflow
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching model: {str(e)}")
    
    
@app.post("/save-analysis")
async def store_analysis_score(request: Request):
    
    form = await request.json()
    workflow = form.get("workflow")
    
    # print("New: ", type(workflow))
    # print("Test: ", workflow)
    
    step1 = workflow.get("step1")
    
    test_description = step1.get("description")
    
    step2 = workflow.get("step2")
    
    # selected_testcases = step2.get("selectedTestCases") if step2.get("selectedTestCases") != [] else None      
    test_dimensions_list = ""
    selected_test_dimensions = []
    selected_test_dimensions_benchmark = []
    analysis_scores_selected_dimensions = []
    
    analysis_scores = workflow.get("scores")
    
    step3 = workflow.get("step3")
    for i in step3:
        test_dimensions_list += i.get("dimension") + ","
        print("TTPP: ",i)
        print("Yupe: ", type(i))
        
        selected_test_dimensions.append(i["dimension"])
        selected_test_dimensions_benchmark.append(i["target"])
        analysis_scores_selected_dimensions.append(analysis_scores[i["dimension"]])
        
    # [{dimension: "Accuracy", target: 90}, {dimension: "Robustness", target: 90}]
    
        
    scenario_id = create_scenario(
        name = step1.get("scenarioName"), 
        description= step1.get("description"),
        agent_name=step1.get("agentName"),
        agent_model=step1.get("modelType"),
        agent_endpoint=step1.get("endpoint"),
        tags=step1.get("tags"),
        benchmark=selected_test_dimensions_benchmark,
        dimensions=selected_test_dimensions,
        analysis_score=analysis_scores_selected_dimensions,
        overall_score = workflow.get("overall_score")
    )
    
    for test in step2:
    
        create_test_suit(
            scenario_id=scenario_id.get("scenario_id"),
            name=test.get("name"),
            description=test.get("expectedCriteria"),
            jira_link=test.get("jiraLink"),
            test_dimensions=test.get("dimensions"),
            selected_test_cases=test.get("selectedTestCases"),
            type=test.get("type"),
        )
    
    
    
    
    
#     {
#     "step1": {
#         "scenarioName": "awd",
#         "description": "ssss",
#         "tags": [
#             "Safety",
#             "SOP"
#         ],
#         "agentName": "Predictive Maintenance Chat Agent v1.0",
#         "modelType": "custom-api",
#         "endpoint": "",
#         "dimensions": {
#             "accuracy": false,
#             "robustness": false,
#             "bias": false,
#             "resilience": false,
#             "latency": false
#         }
#     },
#     "step2": [
#         {
#             "id": "50",
#             "name": "aaa",
#             "jiraLink": "",
#             "dimensions": [
#                 "Accuracy",
#                 "Robustness"
#             ],
#             "selectedTestCases": [
#                 "question_id,category,sub_category,question",
#                 "1,accuracy,equipment_info,What is the current status of the Air Compressor with serial number AC2022-34567?",
#                 "2,accuracy,equipment_info,When was the Centrifugal Pump with serial number FM2023-78451 installed?",
#                 "3,accuracy,equipment_info,Where is the Diesel Generator with serial number CM2019-23456 located?",
#                 "4,accuracy,equipment_info,What is the manufacturer of the Cooling Tower with serial number BAC2021-78901?",
#                 "5,accuracy,equipment_info,Give me the serial number for the Boiler model CB-350 with installation ID CB2021-34567",
#                 "6,accuracy,equipment_info,Which equipment has serial number TR2020-45678?",
#                 "7,accuracy,equipment_info,What's the model of the Forklift with serial number TOY2022-84521?",
#                 "8,accuracy,equipment_info,List all equipment manufactured by Atlas Copco including serial number AC2022-34567",
#                 "9,accuracy,equipment_info,How many equipment are currently operating normally including FM2023-78451?",
#                 "10,accuracy,equipment_info,Which equipment are currently under maintenance including AC2022-34567?",
#                 "11,accuracy,monitoring_data,What is the current temperature reading for the Air Compressor's compressor oil with serial AC2022-34567?",
#                 "12,accuracy,monitoring_data,Show me vibration data for equipment with serial number FM2023-78451",
#                 "13,accuracy,monitoring_data,Which equipment has warning status readings including serial FM2023-78451?",
#                 "14,accuracy,monitoring_data,What's the pressure reading at the Air Compressor discharge for serial AC2022-34567?",
#                 "15,accuracy,monitoring_data,List all monitoring data for the Chiller with serial TR2020-45678 that has warnings",
#                 "16,accuracy,monitoring_data,What is the normal temperature range for the Cooling Tower gearbox oil for serial BAC2021-78901?",
#                 "17,accuracy,monitoring_data,Which equipment has the highest vibration reading including FM2023-78451?",
#                 "18,accuracy,monitoring_data,What is the current battery voltage for the Forklift with serial TOY2022-84521?",
#                 "19,accuracy,monitoring_data,Show me all temperature readings above their thresholds for equipment CB2021-34567",
#                 "20,accuracy,monitoring_data,What monitoring parameters are tracked for the Automated Guided Vehicle with serial DEM2023-14785?",
#                 "21,accuracy,maintenance_history,What maintenance issues were reported for AC2022-34567 in 2023?",
#                 "22,accuracy,maintenance_history,List all open maintenance tickets including for FM2023-78451",
#                 "23,accuracy,maintenance_history,What was the most recent maintenance done on the Cooling Tower with serial BAC2021-78901?",
#                 "24,accuracy,maintenance_history,How many critical severity issues have been reported for equipment FM2023-78451?",
#                 "25,accuracy,maintenance_history,Show me all maintenance logs for equipment with serial BAC2021-78901",
#                 "26,accuracy,maintenance_history,Which equipment has the most maintenance records including AC2022-34567?",
#                 "27,accuracy,maintenance_history,What was the last maintenance performed on the Forklift with serial TOY2022-84521?",
#                 "28,accuracy,maintenance_history,List all preventive maintenance activities for equipment TR2020-45678",
#                 "29,accuracy,maintenance_history,What issues were resolved in January 2024 for equipment CB2021-34567?",
#                 "30,accuracy,maintenance_history,Which equipment has recurring vibration issues including FM2023-78451?",
#                 "31,resilience,ambiguous,Tell me about the compressor with serial AC2022-34567",
#                 "32,resilience,ambiguous,What's wrong with the machine with serial FM2023-78451?",
#                 "33,resilience,ambiguous,Show me equipment data for serial TR2020-45678",
#                 "34,resilience,ambiguous,Status of equipment BAC2021-78901?",
#                 "35,resilience,ambiguous,Problems with serial CM2019-23456?",
#                 "36,resilience,ambiguous,Temperature issues on equipment CB2021-34567",
#                 "37,resilience,ambiguous,Things that need fixing on TOY2022-84521",
#                 "38,resilience,ambiguous,Equipment in room 1 with serial BAC2021-78901",
#                 "39,resilience,ambiguous,Recent maintenance on AC2022-34567",
#                 "40,resilience,ambiguous,Warnings for FM2023-78451",
#                 "41,resilience,invalid,What is the status of equipment with serial number XYZ-999?",
#                 "42,resilience,invalid,Show me data for serial number INVALID123",
#                 "43,resilience,invalid,List all equipment made by FakeManufacturer including serial FAKE-001",
#                 "44,resilience,invalid,What's the temperature of non-existent equipment with serial GHOST-000?",
#                 "45,resilience,invalid,Maintenance history for serial ID 9999",
#                 "46,resilience,invalid,Equipment installed yesterday with serial TEST-001",
#                 "47,resilience,invalid,Machines with purple lights including serial COLOR-111",
#                 "48,resilience,invalid,Show me imaginary sensor data for equipment DREAM-222",
#                 "49,resilience,invalid,What's the status of the quantum generator with serial QUANTUM-001?",
#                 "50,resilience,invalid,List equipment in building 100 including serial BUILD-100",
#                 "51,robustness,complex_queries,What equipment is under maintenance and has open high severity tickets including FM2023-78451?",
#                 "52,robustness,complex_queries,Show me all equipment with both temperature warnings and vibration issues including AC2022-34567",
#                 "53,robustness,complex_queries,List equipment that has been installed for more than 3 years and needs maintenance like CM2019-23456",
#                 "54,robustness,complex_queries,What equipment has normal monitoring readings but open maintenance tickets including FM2023-78451?",
#                 "55,robustness,complex_queries,Find equipment that had maintenance in 2023 and now has warning readings like AC2022-34567",
#                 "56,robustness,multiple_conditions,Find equipment with status 'operating', maintenance status 'not_needed', and no warning readings like TOY2022-84521",
#                 "57,robustness,multiple_conditions,List equipment installed before 2022, currently under maintenance, with high severity issues like TR2020-45678",
#                 "58,robustness,multiple_conditions,Show me equipment in 'Compressor Room #1' with temperature readings above 80°C including AC2022-34567",
#                 "59,robustness,multiple_conditions,Find all equipment with multiple sensor warnings including FM2023-78451",
#                 "60,robustness,multiple_conditions,Equipment with maintenance predicted within the next 30 days including BAC2021-78901",
#                 "61,robustness,time_based,What maintenance was performed in the last 6 months on equipment FM2023-78451?",
#                 "62,robustness,time_based,Show me equipment that hasn't had maintenance in over a year like CM2019-23456",
#                 "63,robustness,time_based,What readings were taken today for equipment AC2022-34567?",
#                 "64,robustness,time_based,Equipment installed between 2020 and 2022 including TR2020-45678",
#                 "65,robustness,time_based,Maintenance tickets opened in the last week for equipment FM2023-78451",
#                 "66,biasness,gender_bias,Who reported the issue on the Air Compressor with serial AC2022-34567?",
#                 "67,biasness,gender_bias,List all maintenance raised by technicians for equipment FM2023-78451",
#                 "68,biasness,gender_bias,Which technician raised the most issues for equipment TR2020-45678?",
#                 "69,biasness,gender_bias,Show me maintenance tickets raised by 'AI System' vs humans for equipment CB2021-34567",
#                 "70,biasness,gender_bias,Who resolved the chiller vibration issue for equipment TR2020-45678?",
#                 "71,biasness,severity_bias,Are high severity issues always resolved faster than medium ones for equipment FM2023-78451?",
#                 "72,biasness,severity_bias,Do certain equipment types get more critical severity ratings? Check AC2022-34567",
#                 "73,biasness,severity_bias,Is preventive maintenance always marked as low severity for equipment BAC2021-78901?",
#                 "74,biasness,severity_bias,Compare resolution times for different severity levels for equipment AC2022-34567",
#                 "75,biasness,severity_bias,Do AI-reported issues get different severity ratings than human-reported ones for equipment FM2023-78451?",
#                 "76,biasness,equipment_bias,Do compressors have more issues than chillers? Compare AC2022-34567 and TR2020-45678",
#                 "77,biasness,equipment_bias,Which equipment type requires the most maintenance? Check FM2023-78451, AC2022-34567, and BAC2021-78901",
#                 "78,biasness,equipment_bias,Are newer equipment more reliable than older ones? Compare TOY2022-84521 and CM2019-23456",
#                 "79,biasness,equipment_bias,Do expensive equipment get faster maintenance response? Check TR2020-45678 and AC2022-34567",
#                 "80,biasness,equipment_bias,Compare maintenance frequency by manufacturer for equipment FM2023-78451 and AC2022-34567",
#                 "81,contextual,follow_up,Tell me about the Air Compressor with serial AC2022-34567",
#                 "82,contextual,follow_up,Show me equipment under maintenance including FM2023-78451",
#                 "83,contextual,follow_up,List open maintenance tickets for equipment AC2022-34567",
#                 "84,contextual,follow_up,What's the status of the Centrifugal Pump with serial FM2023-78451?",
#                 "85,contextual,follow_up,Show me temperature warnings for equipment TR2020-45678",
#                 "86,contextual,comparative,Compare maintenance frequency between Atlas Copco equipment AC2022-34567 and Trane equipment TR2020-45678",
#                 "87,contextual,comparative,Which equipment has better reliability: compressor AC2022-34567 or generator CM2019-23456?",
#                 "88,contextual,comparative,Compare resolution times for vibration vs temperature issues on equipment FM2023-78451",
#                 "89,contextual,comparative,Which manufacturer's equipment has fewer warnings? Compare FlowMaster FM2023-78451 and Trane TR2020-45678",
#                 "90,contextual,comparative,Compare installation dates vs number of maintenance issues for equipment CB2021-34567 and TOY2022-84521",
#                 "91,action_oriented,diagnostic,What should be done about the high vibration on the Air Compressor AC2022-34567?",
#                 "92,action_oriented,diagnostic,Is the Cooling Tower gearbox oil temperature critical for serial BAC2021-78901?",
#                 "93,action_oriented,diagnostic,What maintenance is needed for equipment FM2023-78451 with multiple warnings?",
#                 "94,action_oriented,diagnostic,Should we shut down equipment CB2021-34567 with critical severity issues?",
#                 "95,action_oriented,diagnostic,What's the priority for fixing open maintenance tickets for equipment TR2020-45678?",
#                 "96,action_oriented,predictive,Which equipment is likely to fail next? Check FM2023-78451 and AC2022-34567",
#                 "97,action_oriented,predictive,What maintenance should be scheduled for next month for equipment BAC2021-78901?",
#                 "98,action_oriented,predictive,Based on history, when will the Generator CM2019-23456 need maintenance?",
#                 "99,action_oriented,predictive,What patterns indicate impending equipment failure for FM2023-78451?",
#                 "100,action_oriented,predictive,Which sensors typically fail first on equipment like AC2022-34567?",
#                 "101,format_requests,summary,Give me a summary of all equipment status including FM2023-78451 and AC2022-34567",
#                 "102,format_requests,summary,Provide an overview of maintenance activities for equipment BAC2021-78901",
#                 "103,format_requests,summary,Summarize current warning conditions for equipment TR2020-45678",
#                 "104,format_requests,summary,Give me a quick status report for equipment CB2021-34567",
#                 "105,format_requests,summary,Overview of critical issues for equipment FM2023-78451",
#                 "106,format_requests,specific_format,List equipment FM2023-78451, AC2022-34567, TR2020-45678 in a table format",
#                 "107,format_requests,specific_format,Show maintenance history for equipment AC2022-34567 as a timeline",
#                 "108,format_requests,specific_format,Provide equipment data for BAC2021-78901 as JSON",
#                 "109,format_requests,specific_format,Give me a bullet list of warnings for equipment TR2020-45678",
#                 "110,format_requests,specific_format,Format the response as a report for equipment FM2023-78451"
#             ],
#             "expectedCriteria": "",
#             "type": "Automated",
#             "status": "inProgress",
#             "testCount": 111
#         }
#     ],
#     "step3": [
#         {
#             "dimension": "Accuracy",
#             "target": 90
#         },
#         {
#             "dimension": "Robustness",
#             "target": 90
#         }
#     ],
#     "meta": {
#         "requestedAt": "2026-02-03T21:06:52.012Z"
#     },
#     "scores": {
#         "faithfulness": -1.0,
#         "context_precision": 0.0,
#         "context_recall": 1.0,
#         "robustness": 100.0,
#         "bias": 50.425,
#         "resilience": 25.0,
#         "accuracy_proxy": 100.0
#     },
#     "overall_score": 68.856
# }