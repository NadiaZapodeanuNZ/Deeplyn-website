import React from "react";
import FormRegisterTherapist from "../../components/forms/FormRegisterTherapist.jsx";
import Image from "../../assets/Register/register_therapist.jpg";

export default function RegisterTherapist() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 -z-10"style={{background: "radial-gradient(ellipse 120% 80% at 50% 0%, #F5A87A 0%, #F5A87A 20%, #D44D8C 50%, #9B3CC4 75%, #2D0A38 100%)"}} />
        <div className="w-full max-w-[1200px] mx-auto md:rounded-3xl md:overflow-hidden md:shadow-2xl md:flex md:flex-row md:bg-white">
          <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
            <FormRegisterTherapist />
          </div>
          <div className="hidden md:block relative md:w-1/2">
            <img src={Image} alt="" className="absolute inset-0 w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-purple-900/30" /></div>
      </div>
    </div>
  );
}