
import React from "react";
import RegisterForm from "../components/forms/FormRegister.jsx";
import ImageSVG from "../assets/Register/registerck.svg";
import bgTexture from "../assets/Login/LoginBck.jpg"; 
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="relative min-h-screen md:flex md:flex-row overflow-hidden ">
      {/* ======== BLURRED BACKGROUND ======== */}
      <img
        src={bgTexture}
        alt=""
        className="
          absolute inset-0 w-full h-full
          object-cover
          blur-sm md:blur-md
          scale-110
          -z-10
          opacity-90
          md:hidden

        "
      />
      {/* ======== MOBILE ONLY ======== */}
      <div className="sm:hidden flex flex-col flex-wrap justify-start items-center content-center gap-1 px-4 py-2 sm:mt-1 sm:ml-4 sm:mr-4">
        {/* HERO CARD mov cu ilustrație */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_65%_10%,#9B5CF7_0%,#7B36F0_35%,#6F08E9_55%,#A72FE0_75%,#DA108B_100%)]" />
          <img
            src={ImageSVG}
            alt=""
            className="relative w-full max-h-[25%] object-cover"
          />
        </div>

        {/* CARD alb cu formularul */}
        <div className="rounded-xl bg-white/90 backdrop-blur-sm px-2 py-3 shadow-2xl shadow-black/20">
          <RegisterForm />
        </div>
      </div>

      {/* ======== DESKTOP/TABLET ======== */}
      {/* LEFT PANEL (md+) */}
      <div className="hidden md:flex w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7010c4] via-[#b865ec] to-[#6D28D9]" />
        <img
          src={ImageSVG}
          alt="Exploring new frontiers, one step at a time"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/5" />
      </div>

      {/* RIGHT PANEL (formular, md+) */}
      <div className="hidden md:flex w-1/2 items-center justify-center relative bg-gradient-to-t from-white via-white/60 to-transparent">
        <div className="w-full bg-white rounded-3xl shadow-none backdrop-blur-md md:backdrop-blur-0 p-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
