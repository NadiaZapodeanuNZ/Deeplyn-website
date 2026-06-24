import { useState } from "react";
import Image1 from '../../assets/Landing/journal.png'
import Image2 from '../../assets/Landing/share.png'
import Image3 from '../../assets/Landing/therapist.png'

const slides = [
  { src: Image1, alt: "" },
  { src: Image2, alt: "" },
  { src: Image3, alt: "" },
];

const steps = [
  {
    number: "01",
    title: "You journal freely",
    description:
      "Write what's on your mind. Tag entries with emotions - manually or let the app suggest them based on what you wrote.",
  },
  {
    number: "02",
    title: "You choose what to share",
    description:
      "No pressure. When you feel ready, select the entries you want your therapist to see and send them with one tap.",
  },
  {
    number: "03",
    title: "Your therapist arrives prepared",
    description:
      "They read your notes before the session, so you spend less time catching up and more time going deeper.",
  },
];



const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);


const Step = ({ step, isLast }) => (
  <div className="flex gap-5">
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="w-10 h-10 rounded-full flex items-center justify-center
                      text-white text-xs font-bold tracking-wide flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #9B3CC4, #D44D8C)" }}>
        {step.number}
      </div>

      {!isLast && (
        <div className="w-px flex-1 my-1.5 min-h-[28px]"
        style={{background:"linear-gradient(to bottom, rgba(155,60,196,0.35), rgba(212,77,140,0.1))",}}/>)}
    </div>


    <div className={isLast ? "pb-0" : "pb-7"}>
      <p className="m-0 text-[15px] font-semibold text-[#2D0A38] leading-snug mb-1.5">
        {step.title}
      </p>
      <p className="m-0 text-[13px] text-[#7A4A8A] leading-relaxed">
        {step.description}
      </p>
    </div>
  </div>
);
const ImageSlider = () => {
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1));

  return (
    <div className="relative w-full rounded-3xl overflow-hidden
                    border border-[#9B3CC4]/12 shadow-xl shadow-[#9B3CC4]/08
                    bg-[#F5EAFF]">

      {slides.map((slide, i) => (
        <img key={i} src={slide.src} alt={slide.alt}
          className={`w-full h-auto block transition-opacity duration-500 ease-in-out
                      ${i === current ? "relative opacity-100" : "absolute top-0 left-0 opacity-0 pointer-events-none"}`}/>
      ))}

      <button
        onClick={prev} aria-label="Previous photo"
        className="absolute left-3 top-1/2 -translate-y-1/2
                   w-9 h-9 rounded-full
                   bg-white/80 backdrop-blur-sm
                   border border-[#9B3CC4]/20
                   flex items-center justify-center
                   text-[#9B3CC4]
                   hover:bg-white hover:shadow-md
                   transition-all duration-200">
        <ChevronLeft />
      </button>

      <button onClick={next} aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2
                   w-9 h-9 rounded-full
                   bg-white/80 backdrop-blur-sm
                   border border-[#9B3CC4]/20
                   flex items-center justify-center
                   text-[#9B3CC4]
                   hover:bg-white hover:shadow-md
                   transition-all duration-200">
        <ChevronRight />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2
                      flex items-center gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            aria-label={`Go to photo ${i + 1}`}
            className="transition-all duration-300 rounded-full"
            style={{width: i === current ? 20 : 7,
                    height: 7,
                    background: i === current ? "linear-gradient(90deg, #9B3CC4, #D44D8C)": "rgba(155,60,196,0.25)",
                    border: "none",cursor: "pointer",padding: 0}}/>))}
      </div>
    </div>
  );
};

export default function TherapistsSection() {
  return (
    <section className="bg-[#FDF6FF] py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-[#2D0A38]
                       tracking-tight leading-tight">
            From your thoughts to{" "}
            <span className="italic"
                  style={{background: "linear-gradient(90deg, #9B3CC4, #D44D8C)",
                          WebkitBackgroundClip: "text",WebkitTextFillColor: "transparent",
                          backgroundClip: "text"}}>
              real support
            </span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-10">
          <div className="flex-1 flex flex-col justify-center">
            {steps.map((step, i) => (
              <Step
                key={step.number}
                step={step}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>

          <div className="flex-1">
            <ImageSlider />
          </div>

        </div>
      </div>
    </section>
  );
}