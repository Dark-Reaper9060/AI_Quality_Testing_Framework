from ..LLM_Model import llm_config as llm

from langchain.chat_models import init_chat_model

import json
from typing import Dict, List, Optional
import re


def generate_testcases(test_description: str, test_dimensions_list: str, selected_testcases: Optional[List[str]]) -> Dict:
    """
    Generate test cases for LLM evaluation based on specified dimensions.
    
    Args:
        test_description: Description of the overall test scenario
        test_dimensions_list: Comma-separated string of test dimensions
        selected_testcases: List of example test cases for reference
    
    Returns:
        Dictionary with test dimensions as keys and comma-separated test cases as values
    """
    
    print("Entered")
    
    dimensions = [dim.strip() for dim in test_dimensions_list.split(",") if dim.strip()]
    
    # Format selected testcases for the prompt - use CSV data as reference
    examples_text = ""
    if selected_testcases and len(selected_testcases) > 0:
        # Take first 5 examples as reference
        examples_text = "EXAMPLE TEST CASES FROM CSV DATA (for style reference only):\n"
        examples_text += "\n".join([f"  - {testcase}" for testcase in selected_testcases[:5]])
    
    system_prompt = """You are an expert test case generator for LLM evaluation. Your ONLY output must be a valid JSON object.
    
CRITICAL RULES:
1. Output ONLY raw JSON, no explanations, no markdown, no code blocks
2. JSON format: {"dimension_name": "test_case_1, test_case_2, test_case_3"}
3. Generate 3-5 test cases per dimension
4. Test cases must be complete, actionable prompts/questions
5. Test cases MUST directly test the specified dimension
6. If Example Test Cases are provided, use them ONLY as style reference - DO NOT copy them
7. If no Example Test Cases are provided, generate based on Test Description and Dimensions only
8. Use varied contexts, difficulty levels, and phrasing
9. Ensure test cases are measurable and specific
10. All test cases should be equipment maintenance chatbot related based on the scenario

EXAMPLE OUTPUT FORMAT:
{"accuracy": "What is the current status of Air Compressor AC-200-SS?, When was Centrifugal Pump XYZ-500 installed?, List all equipment manufactured by Atlas Copco", "resilience": "Tell me about the compressor, What's wrong with the machine?, Show me equipment data"}"""

    user_prompt = f"""Generate test cases for an equipment maintenance chatbot with these parameters:

TEST SCENARIO DESCRIPTION: {test_description}

TEST DIMENSIONS TO EVALUATE: {test_dimensions_list}

{examples_text}

CRITICAL REQUIREMENTS:
1. Create 3-5 DIFFERENT test cases for EACH dimension
2. Test cases should be PRACTICAL and MEASURABLE queries for an equipment maintenance chatbot
3. Cover different aspects of each dimension (simple queries, complex queries, edge cases)
4. Include both direct and indirect ways to test each dimension
5. Use natural, conversational language like users would ask
6. ALL test cases MUST be equipment maintenance related based on the scenario
7. DO NOT copy any example test cases if provided - use them only to understand the style
8. Ensure test cases can be answered using equipment data, monitoring data, and maintenance logs

OUTPUT REQUIREMENTS:
- Output ONLY the JSON object with NO additional text
- Use the EXACT dimension names provided: {', '.join(dimensions)}
- Each dimension should have a string value with 3-5 comma-separated test cases

FINAL OUTPUT FORMAT (JSON ONLY):
{{
  "{dimensions[0] if dimensions else 'dimension'}": "test case 1, test case 2, test case 3",
  "{dimensions[1] if len(dimensions) > 1 else 'dimension2'}": "test case 4, test case 5, test case 6"
}}"""

    instruction = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": user_prompt
        }
    ]
    
    try:
        # Call the LLM model
        response = llm.llm_model.invoke(instruction)
        
        # Extract response content
        if hasattr(response, 'content'):
            response_text = response.content
        elif hasattr(response, 'text'):
            response_text = response.text
        else:
            response_text = str(response)
        
        # Clean the response text
        response_text = response_text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        # Remove any leading/trailing whitespace and quotes
        response_text = response_text.strip()
        
        # Try to find JSON in the response
        json_pattern = r'\{.*\}'
        json_match = re.search(json_pattern, response_text, re.DOTALL)
        
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = response_text
        
        # Parse JSON
        try:
            result = json.loads(json_str)
            
            # Validate and ensure all dimensions are present
            if not isinstance(result, dict):
                raise ValueError("Response is not a JSON object")
            
            # Ensure all dimensions from input are in the result
            for dimension in dimensions:
                if dimension not in result:
                    # Create default test cases for missing dimension
                    result[dimension] = f"Assess {dimension} in scenario A, Evaluate {dimension} in scenario B, Test {dimension} in scenario C"
                else:
                    # Ensure the value is a string
                    if not isinstance(result[dimension], str):
                        result[dimension] = ", ".join(result[dimension]) if isinstance(result[dimension], list) else str(result[dimension])
            
            # Remove any extra keys not in dimensions list
            keys_to_remove = [key for key in result.keys() if key not in dimensions]
            for key in keys_to_remove:
                del result[key]
            
            return result
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, create a structured fallback
            fallback_result = {}
            for dimension in dimensions:
                # Try to extract test cases from response text for this dimension
                test_cases = []
                
                # Look for dimension name in response
                if dimension.lower() in response_text.lower():
                    # Find lines after dimension mention
                    lines = response_text.split('\n')
                    for i, line in enumerate(lines):
                        if dimension.lower() in line.lower():
                            # Collect next few non-empty lines as potential test cases
                            for j in range(i+1, min(i+6, len(lines))):
                                if lines[j].strip() and not lines[j].strip().startswith(('{', '[', '}', ']', '#', '//', '/*')):
                                    clean_line = lines[j].strip().strip('-*• ').strip('"\'')
                                    if clean_line and len(clean_line) > 10:  # Ensure it's substantial
                                        test_cases.append(clean_line)
                                if len(test_cases) >= 3:
                                    break
                
                # If no test cases found or less than 3, add defaults
                if len(test_cases) < 3:
                    test_cases.extend([
                        f"Test {dimension} with scenario X",
                        f"Evaluate {dimension} in situation Y",
                        f"Assess {dimension} performance in context Z"
                    ][:3 - len(test_cases)])
                
                fallback_result[dimension] = test_cases
            
            return fallback_result
            
    except Exception as e:
        # Ultimate fallback - return structured test cases
        fallback = {}
        for dimension in dimensions:
            fallback[dimension] = ", ".join([
                f"Measure {dimension} in case 1",
                f"Test {dimension} with example 2",
                f"Evaluate {dimension} using scenario 3"
            ])
        
        return fallback