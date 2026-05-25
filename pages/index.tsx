"use client";

import Link from "next/link";
import {
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">

        {/* Navigation */}
        <nav className="flex justify-between items-center mb-12">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            MediNotes Pro
          </h1>

          <div>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/product"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg"
                >
                  Go to App
                </Link>

                <UserButton />
              </div>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="text-center py-16">
          <h2 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Transform Your
            <br />
            Consultation Notes
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            AI-powered assistant that generates professional summaries,
            action items, and patient communications.
          </p>

          {/* CTA */}
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl hover:opacity-90">
                Start Free Trial
              </button>
            </SignInButton>
          ) : (
            <Link href="/product">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl hover:opacity-90">
                Open Consultation Assistant
              </button>
            </Link>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>For demonstration purposes only</p>
        </div>

      </div>
    </main>
  );
}