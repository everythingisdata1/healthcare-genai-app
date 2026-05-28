import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import (
    StreamingResponse,
    FileResponse,
)
from fastapi.staticfiles import StaticFiles
from fastapi_clerk_auth import (
    ClerkConfig,
    ClerkHTTPBearer,
    HTTPAuthorizationCredentials,
)
from openai import OpenAI
from pydantic import BaseModel

app = FastAPI(
    title="AWS HealthCareGenAI API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Clerk Authentication

clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(config=clerk_config)

# OpenAI Client

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# Request Model


class Visit(BaseModel):
    patient_name: str
    date_of_visit: str
    notes: str


# AI Prompt

system_prompt = """
                You are a healthcare AI assistant.
                
                Generate:
                1. Visit Summary
                2. Next Steps
                3. Patient Email
                
                IMPORTANT:
                - Total response must be under 50 words.
                - Keep concise and professional.
                - Use simple language.
                """


def user_prompt_for_visit(visit: Visit, ) -> str:
    return f"""
            Create:
            1. Short summary
            2. Next steps
            3. Short email
            
            Maximum 50 words total.
            
            Patient Name:
            {visit.patient_name}
            
            Visit Date:
            {visit.date_of_visit}
            
            Notes:
            {visit.notes}
            """


@app.post("/api/consultation")
async def summarize_visit(visit: Visit, creds: HTTPAuthorizationCredentials = Depends(clerk_guard), ):
    print(f"Authenticated user with token: {creds.decoded["sub"]}")
    print(f"Received visit data: {creds.credentials}, {visit}")
    user_prompt = (user_prompt_for_visit(visit))

    messages=[{
        "role": "system",
        "content": system_prompt,
    },
    {
        "role": "user",
        "content": user_prompt,
    },

]

    async def event_generator():
        stream = client.chat.completions.create(model="gpt-4o-mini", messages=messages, stream=True, )
        for chunk in stream:
            content = chunk.choices[0].delta.content

            if content:
                yield f"data: {content}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no", },
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Static Frontend

STATIC_DIR = "/app/static"


@app.get("/")
async def homepage():
    return FileResponse(f"{STATIC_DIR}/index.html")


app.mount("/_next", StaticFiles(directory=f"{STATIC_DIR}/_next"), name="next_assets", )

app.mount("/assets", StaticFiles(directory=STATIC_DIR), name="assets", )
