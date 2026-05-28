"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  useAuth,
  UserButton,
} from "@clerk/nextjs";

export default function ProductPage() {
  const { getToken } = useAuth();

  const [patientName, setPatientName] =
    useState("");

  const [visitDate, setVisitDate] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [output, setOutput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setOutput("");

    try {
      const jwt = await getToken({
        skipCache: true,
      });

      if (!jwt) {
        setOutput(
          "Authentication required"
        );

        setLoading(false);
        return;
      }

      const response = await fetch(
        "/api/consultation",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            patient_name: patientName,
            date_of_visit: visitDate,
            notes,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          `HTTP ${response.status}: ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error(
          "Streaming not supported"
        );
      }

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let accumulatedText = "";

      while (true) {
        const { done, value } =
          await reader.read();

        if (done) {
          break;
        }

        const chunk =
          decoder.decode(value, {
            stream: true,
          });

        console.log(
          "RAW CHUNK:",
          chunk
        );

        // Proper SSE parsing
        const lines = chunk
          .split("\n")
          .filter((line) =>
            line.startsWith("data:")
          );

        for (const line of lines) {
          const text = line
            .replace("data:", "")
            .trim();

          accumulatedText +=
            text + " ";

          setOutput(
            accumulatedText
          );
        }
      }
    } catch (err) {
      console.error(err);

      setOutput(
        err instanceof Error
          ? err.message
          : "Unknown error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-10">

        {/* Navigation */}

        <nav className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              MediNotes Pro
            </h1>

            <p className="text-gray-500 mt-1">
              AI-powered consultation
              assistant
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
            >
              Home
            </Link>

            <UserButton />
          </div>
        </nav>

        {/* Main Grid */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Panel */}

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">

            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
              Patient Visit Details
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* Patient Name */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Patient Name
                </label>

                <input
                  type="text"
                  value={patientName}
                  onChange={(e) =>
                    setPatientName(
                      e.target.value
                    )
                  }
                  placeholder="Enter patient name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Visit Date */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Visit Date
                </label>

                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) =>
                    setVisitDate(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Doctor's Notes
                </label>

                <textarea
                  rows={10}
                  value={notes}
                  onChange={(e) =>
                    setNotes(
                      e.target.value
                    )
                  }
                  placeholder="Enter patient consultation notes..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Button */}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl text-white font-semibold transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90"
                }`}
              >
                {loading
                  ? "Generating..."
                  : "Generate Summary"}
              </button>

            </form>
          </div>

          {/* Right Panel */}

          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 flex flex-col">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                AI Generated Output
              </h2>

              {loading && (
                <span className="text-blue-600 font-medium animate-pulse">
                  Streaming...
                </span>
              )}
            </div>

            <div className="flex-1 min-h-[500px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 overflow-y-auto whitespace-pre-line text-gray-800 dark:text-gray-200 leading-8">
              {output ? (
                output
              ) : (
                <div className="text-gray-400">
                  AI response will
                  appear here...
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}

        <div className="text-center text-sm text-gray-500 mt-10">
          <p>
            AI-generated medical
            summaries for demonstration
            purposes only
          </p>
        </div>

      </div>
    </main>
  );
}