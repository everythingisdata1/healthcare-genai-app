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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">

        <nav className="flex justify-between items-center mb-12">

          <h1 className="text-2xl font-bold">
            IdeaGen
          </h1>

          <div>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="bg-blue-600 text-white py-2 px-6 rounded-lg">
                  Sign In
                </button>
              </SignInButton>
            ) : (
             <div className="flex gap-4 items-center">
  <Link
    href="/product"
    className="bg-blue-600 text-white py-2 px-6 rounded-lg"
  >
    Go to App
  </Link>

  <UserButton />
</div>
            )}
          </div>

        </nav>

        <div className="text-center py-24">

          <h2 className="text-6xl font-bold mb-6">
            Generate Your Next
            <br />
            Big Business Idea
          </h2>

          <p className="text-xl mb-12">
            Harness AI to discover innovative business opportunities
          </p>

          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="bg-blue-600 text-white py-4 px-8 rounded-xl">
                Get Started Free
              </button>
            </SignInButton>
          ) : (
            <Link href="/product">
              <button className="bg-blue-600 text-white py-4 px-8 rounded-xl">
                Generate Ideas Now
              </button>
            </Link>
          )}

        </div>

      </div>
    </main>
  );
}