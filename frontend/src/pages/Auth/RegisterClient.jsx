import React from "react";
import RegisterForm from "../../components/forms/FormRegister.jsx";
import ImageSVG from "../../assets/Register/registerck.svg";
import bgTexture from "../../assets/Login/LoginBck.jpg"; 
import Image from "../../assets/Register/register_v2.jpg";
import { Link } from "react-router-dom";
export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
     <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_#fdf4ff_0%,_#f0e6ff_30%,_#c4b5fd_65%,_#8b5cf6_100%)]" />
      <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row bg-white">
        <div className="hidden md:block relative md:w-1/2">
          <img src={Image} alt="" className="absolute inset-0 w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-purple-900/20" />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-2 md:p-8
                        bg-white shadow-2xl rounded-3xl md:rounded-l-none md:rounded-r-3xl">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}


