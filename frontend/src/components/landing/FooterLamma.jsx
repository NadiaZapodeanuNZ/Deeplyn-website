import React from "react";
import { Link } from "react-router-dom";
import llamaSrc from "../../assets/Landing/llama.png";

export default function FooterLamma() {
  return (
    <section className="w-full py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative">
          <div
            className=" relative rounded-[28px] bg-[linear-gradient(135deg,#C7A0FF_0%,#FFB5E1_55%,#FFD3F0_100%)]
              p-6 sm:p-8 lg:p-10 shadow-[0_18px_40px_rgba(59,28,117,.18)]ring-1 ring-black/10">
            <div className="max-w-[720px] pr-0 lg:pr-40">
              <h3 className="text-[#4A3E7C] text-[clamp(15px,1.3vw,20px)]   font-semibold text-center sm:text-[clamp(20px,3.3vw,34px)] ">
                Ready to Start Your Healing Journey?
              </h3>

              <p className="mt-3 text-[#6E6A8F] text-[clamp(10px,1.2vw,13px)] p-10 text-center sm:text-[clamp(14px,1.6vw,18px)]">
                Join thousands of people who are building healthier relationships with their emotions using{" "}
                <span className="font-semibold text-transparent bg-clip-text bg-[linear-gradient(90deg,#8D57CB,#CC23A2)]">
                  Deeplyn
                </span>.
              </p>
              <div className="mt-6 flex flex-row justify-center gap-4">
                <Link to="/choice" className="flex-col items-center justify-center
                                                rounded-xl px-6 py-2.5
                                                font-medium text-white
                                                shadow-[0_6px_0_rgba(62,22,120,.25)]
                                                transition hover:brightness-110 active:translate-y-[1px]
                                                bg-[linear-gradient(90deg,#6F08E9_0%,#9A2CDB_34%,#D95BCD_67%,#FF8BB5_100%)]">
                Start Today
                </Link>

                <Link to="/learn-more" className="flex-col items-center justify-center
                                                  rounded-xl px-6 py-2.5
                                                  font-medium text-[#5F5A86]
                                                  bg-white/70 backdrop-blur
                                                  border border-white/80
                                                  shadow-[0_6px_0_rgba(62,22,120,.12)]
                                                  hover:bg-white/90 active:translate-y-[1px]">
                  Learn More
                </Link>
              </div>
            </div>
            <img src={llamaSrc} alt="" loading="lazy"
            className="mx-auto mt-6 w-40 h-auto
                        sm:w-48
                        md:absolute md:inset-y-0 md:right-[-32px]
                        md:m-0 md:w-56 lg:w-64 xl:w-72
                        drop-shadow-[0_14px_10px_rgba(0,0,0,.15)]"/>
          </div>
          <div className="absolute -bottom-4 left-6 right-6 h-6 rounded-[999px] bg-black/10 blur-xl -z-10" />
        </div>
      </div>
    </section>
  );
}
