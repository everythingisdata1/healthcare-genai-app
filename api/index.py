import os

from fastapi import FastAPI, Depends
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI
from pydantic import BaseModel
from starlette.responses import StreamingResponse

app = FastAPI(title="HealthCareGenAI API")

clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(config=clerk_config)


class Visit(BaseModel):
    patient_name: str
    date_of_visit: str
    notes: str


system_prompt = """
You are provided with notes written by a doctor from a patient's visit.  
Your task is to summarize the visit for the doctor and provide email. 
Reply with executly thee section with headling 
### Summary of the visit for doctor's records. 
### Next steps for the doctor. 
### Draft an Email to the patient in patient friendly language. 
"""


def user_prompt_for_visit(visit: Visit) -> str:
    return f"""
   Create a summery, next steps and email for the following visit notes:
   Patient Name: {visit.patient_name}
   Doctor Name: {visit.date_of_visit} 
   Visit Notes:    {visit.notes}
    """


@app.post("/api", response_class=StreamingResponse)
async def summarize_visit(visit: Visit, creds: HTTPAuthorizationCredentials = Depends(clerk_guard)):
    user_id = creds.decoded["sub"]
    print(f"User {user_id} is summarizing a visit.")
    openai_client = OpenAI()

    user_prompt = user_prompt_for_visit(visit)
    print(f"User Prompt: {user_prompt}")

    prompt = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    stream = openai_client.chat.completions.create(stream=True, model="gpt-5-nano", messages=prompt)

    def event_stream():
        for chunk in stream:
            text = chunk.choices[0].delta.content
            print(f"text received: {text}")

            if text:
                lines = text.split("\n")
                print(f"lines received: {lines}")
                for line in lines[:-1]:
                    yield f"data: {line}\n\n"
                    yield "data:  \n"
                yield f"data: {lines[-1]}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
