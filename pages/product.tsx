"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchEventSource } from "@microsoft/fetch-event-source";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

export default function Product() {

  const { getToken } = useAuth();

  const [idea, setIdea] =
    useState("Generating...");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    let buffer = "";

    async function load() {

      try {

        const jwt =
          await getToken();

        console.log(
          "TOKEN:",
          jwt?.slice(0, 20)
        );

        if (!jwt) {
          setIdea(
            "Authentication required"
          );

          setLoading(false);

          return;
        }

        await fetchEventSource(
          "/api",
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${jwt}`,

              Accept:
                "text/event-stream",
            },

            openWhenHidden: true,

            async onopen(
              response
            ) {

              console.log(
                "STATUS",
                response.status
              );

              if (
                !response.ok
              ) {
                throw new Error(
                  `HTTP ${response.status}`
                );
              }
            },

            onmessage(
              event
            ) {

              if (
                event.event ===
                "end"
              ) {

                console.log(
                  "finished"
                );

                setLoading(
                  false
                );

                return;
              }

              if (
                event.data
              ) {

                buffer +=
                  event.data;

                setIdea(
                  buffer
                );
              }
            },

            onclose() {

              console.log(
                "stream closed"
              );

              setLoading(
                false
              );
            },

            onerror(
              err
            ) {

              console.error(
                err
              );

              setIdea(
                "Request failed"
              );

              setLoading(
                false
              );

              return;
            },
          }
        );

      } catch (
        err
      ) {

        console.error(
          err
        );

        setIdea(
          "Request failed"
        );

        setLoading(
          false
        );
      }
    }

    load();

  }, [getToken]);

  return (
    <main className="min-h-screen p-10">

      <h1 className="text-5xl mb-8">
        Business Idea Generator
      </h1>

      <div className="bg-white rounded-xl p-8">

        {loading ? (

          <div>
            Generating...
          </div>

        ) : (

          <ReactMarkdown
            remarkPlugins={[
              remarkGfm,
              remarkBreaks,
            ]}
          >
            {idea}
          </ReactMarkdown>

        )}

      </div>

    </main>
  );
}