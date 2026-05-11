import React from "react";
import { Link } from "react-router-dom";

export default function RegisterChoice() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_#f0abfc_0%,_#d946ef_30%,_#9333ea_60%,_#581c87_100%)]" />
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-[clamp(1.5rem,2.5vw,2.5rem)] font-bold text-[#2D1B69]">Join{" "}
              <Link to="/"className="inline-block font-semibold text-transparent bg-clip-text
                         bg-[linear-gradient(90deg,#8D57CB_0%,#943CE7_28%,#A826DE_53%,#C228B2_68%,#CC23A2_80%,#DA108B_100%)]
                         hover:opacity-80 transition-opacity duration-200">
                Deeplyn
              </Link>
            </h1>
            <p className="mt-2 text-[#9022d4] text-sm sm:text-base">How are you joining us today?</p>
          </div>
          <div className="flex flex-col gap-4">
          <Link to="/register/client" className="group flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200
                       hover:border-purple-400 hover:bg-purple-50 transition-all duration-200">
            <div className="w-12 h-12 rounded-full bg-purple-100 group-hover:bg-purple-200
                            flex items-center justify-center flex-shrink-0 transition-colors duration-200">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#2D1B69] text-base">I'm looking for support</p>
              <p className="text-sm text-gray-500 mt-0.5">Create a personal account to connect with therapists</p>
            </div>
            <svg className="w-5 h-5 text-purple-400 flex-shrink-0 opacity-0 group-hover:opacity-100
                            -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            to="/register/therapist"
            className="group flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200
                       hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 group-hover:bg-purple-200
                            flex items-center justify-center flex-shrink-0 transition-colors duration-200">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#2D1B69] text-base">I'm a therapist</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Create a professional account and offer your services
              </p>
            </div>
            <svg className="w-5 h-5 text-purple-400 flex-shrink-0 opacity-0 group-hover:opacity-100
                            -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>


        <p className="mt-7 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}