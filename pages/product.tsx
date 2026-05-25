"use client";

import { useState, FormEvent } from "react";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { fetchEventSource } from "@microsoft/fetch-event-source";

function ConsultationForm() {
  const { getToken } = useAuth();

  const [patientName, setPatientName] = useState("");
  const [visitDate, setVisitDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState("");

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setOutput("");

    try {
      const jwt = await getToken();

      if (!jwt) {
        setOutput("Authentication required");
        setLoading(false);
        return;
      }

      let result = "";

       await fetchEventSource("/api", {
  method: "POST",

  headers: {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  },

  body: JSON.stringify({
    patient_name: patientName,
    date_of_visit: visitDate?.toISOString().split("T")[0],
    notes,
  }),

  async onopen(response) {
    console.log("STATUS:", response.status);

    if (!response.ok) {
      const body = await response.text();

      console.log("SERVER:", body);

      setOutput(
        `Server Error (${response.status}):\n${body}`
      );

      throw new Error(body);
    }

    const type =
      response.headers.get("content-type");

    console.log(type);

    if (
      !type?.includes("text/event-stream")
    ) {
      throw new Error(
        `Expected SSE but got ${type}`
      );
    }
  },

  onmessage(event) {
    setOutput((prev) => prev + event.data);
  },

  onclose() {
    setLoading(false);
  },

  onerror(err) {
    console.error(err);

    setOutput(
      err instanceof Error
        ? err.message
        : "Unknown error"
    );

    setLoading(false);

    throw err;
  },
});
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Consultation Notes
          </h1>

          <p className="mt-2 text-gray-500">
            Generate AI-powered consultation summaries
          </p>
        </div>

        <UserButton />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 space-y-6"
      >
        <div>
          <label className="block mb-2 font-medium">
            Patient Name
          </label>

          <input
            required
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient name"
            className="w-full rounded-xl border border-gray-300 px-5 py-3 outline-none focus:ring-4 focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Date of Visit
          </label>

          <DatePicker
            selected={visitDate}
            onChange={(d: Date | null) => setVisitDate(d)}
            dateFormat="yyyy-MM-dd"
            wrapperClassName="w-full"
            className="w-full rounded-xl border border-gray-300 px-5 py-3 outline-none focus:ring-4 focus:ring-blue-200"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Consultation Notes
          </label>

          <textarea
            rows={8}
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter detailed consultation notes..."
            className="w-full rounded-xl border border-gray-300 px-5 py-3 outline-none focus:ring-4 focus:ring-blue-200 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            rounded-xl
            bg-gradient-to-r
            from-blue-600
            to-indigo-600
            py-4
            text-white
            font-semibold
            shadow-lg
            hover:scale-[1.01]
            transition
            disabled:opacity-60
          "
        >
          {loading
            ? "Generating Summary..."
            : "Generate Summary"}
        </button>
      </form>

      {/* Output */}
      {output && (
        <section className="mt-10">

          <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 p-8">

            <h2 className="text-2xl font-bold mb-6">
              Generated Summary
            </h2>

            <div
              className="
                prose
                prose-blue
                dark:prose-invert
                max-w-none
              "
            >
              <ReactMarkdown
                remarkPlugins={[
                  remarkGfm,
                  remarkBreaks,
                ]}
              >
                {output}
              </ReactMarkdown>
            </div>

          </div>

        </section>
      )}
    </div>
  );
}

function PricingFallback() {
  return (
    <div className="max-w-2xl mx-auto text-center py-24">

      <h1 className="text-5xl font-bold mb-6">
        Healthcare Professional
      </h1>

      <p className="text-gray-500 mb-8">
        Upgrade to unlock consultation generation.
      </p>

      <button
        className="
          rounded-xl
          bg-blue-600
          px-8
          py-4
          text-white
          hover:bg-blue-700
        "
      >
        Upgrade Plan
      </button>

    </div>
  );
}

export default function Product() {
  const { isSignedIn } = useUser();

  if (!isSignedIn) {
    return <PricingFallback />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:to-black">
      <ConsultationForm />
    </main>
  );
}