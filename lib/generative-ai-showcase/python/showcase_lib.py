import os
from langchain.llms.bedrock import Bedrock
from langchain import PromptTemplate


def get_llm():
    
    model_kwargs =  { 
        "maxTokenCount": 1024, 
        "stopSequences": [], 
        "temperature": 0, 
        "topP": 0.9 
    }
    
    llm = Bedrock(
        # credentials_profile_name=os.environ.get("BWB_PROFILE_NAME"), #sets the profile name to use for AWS credentials (if not the default)
        region_name=os.environ.get("BWB_REGION_NAME"), #sets the region name (if not the default)
        endpoint_url=os.environ.get("BWB_ENDPOINT_URL"), #sets the endpoint URL (if necessary)
        model_id="amazon.titan-tg1-large", #use the Anthropic Claude model
        model_kwargs=model_kwargs) #configure the properties for Claude
    
    return llm


def get_prompt(user_input, template):
    
    prompt_template = PromptTemplate.from_template(template) #this will automatically identify the input variables for the template

    prompt = prompt_template.format(user_input=user_input)
    
    return prompt


def get_text_response(user_input, template): #text-to-text client function
    llm = get_llm()
    
    prompt = get_prompt(user_input, template)
    
    return llm.predict(prompt) #return a response to the prompt

