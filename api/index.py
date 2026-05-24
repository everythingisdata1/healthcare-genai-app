import os
from fastapi import FastAPI, Depends
from fastapi_clerk_auth import (
    ClerkConfig,
    ClerkHTTPBearer,
    HTTPAuthorizationCredentials,
)
from openai import OpenAI
from starlette.responses import StreamingResponse

app = FastAPI()

# Clerk
clerk_config = ClerkConfig(
    jwks_url=os.getenv("CLERK_JWKS_URL")
)

clerk_guard = ClerkHTTPBearer(clerk_config)


@app.get("/api")
async def read_api(
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):

    print("STEP 1 → Clerk auth success")
    print("USER:", creds.decoded["sub"])

    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY")
    )

    stream = client.chat.completions.create(
        model="gpt-5-nano",
        messages=[
            {
                "role": "user",
                "content": """
Generate one healthcare business idea.

Return:
- Name
- Description
- Revenue model
- Differentiators
- Risks
- MVP
"""
            }
        ],
        stream=True,
    )

    async def generate():

        try:

            for chunk in stream:

                content = chunk.choices[0].delta.content

                if content:
                    print("SEND:", repr(content))

                    yield f"data: {content}\n\n"

            print("STREAM COMPLETE")

            yield "event: end\ndata: complete\n\n"

        except Exception as e:

            print("STREAM ERROR:", str(e))

            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )