
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logo from "../assets/Landing/logo_full.svg";
import journal_image from "../assets/Landing/landing_page_journal.jpg";
import kitty from "../assets/Landing/progress_2.jpg";
import hero from "../assets/Landing/hero.png";
import pucca from "../assets/Landing/quiz.png";
import FooterLamma from "../components/landing/FooterLamma.jsx";
import TherapistsSection from "../components/landing/TherapistSection.jsx";

const DailyIcon = () => 
(<svg viewBox="-2.4 -2.4 28.80 28.80" fill="none" className="w-5 h-5">
    <path d="M10.5 14L17 14" stroke="#9B3CC4" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 14H7.5" stroke="#9B3CC4" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 10.5H7.5" stroke="#9B3CC4" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 17.5H7.5" stroke="#9B3CC4" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10.5 10.5H17" stroke="#9B3CC4" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10.5 17.5H17" stroke="#9B3CC4" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 3.5C8 2.67157 8.67157 2 9.5 2H14.5C15.3284 2 16 2.67157 16 3.5V4.5C16 5.32843 15.3284 6 14.5 6H9.5C8.67157 6 8 5.32843 8 4.5V3.5Z"
      stroke="#9B3CC4" strokeWidth="1.5" />
    <path d="M21 16.0002C21 18.8286 21 20.2429 20.1213 21.1215C19.2426 22.0002 17.8284 22.0002 15 22.0002H9C6.17157 22.0002 4.75736 22.0002 3.87868 21.1215C3 20.2429 3 18.8286 3 16.0002V13.0002M16 4.00195C18.175 4.01406 19.3529 4.11051 20.1213 4.87889C21 5.75757 21 7.17179 21 10.0002V12.0002M8 4.00195C5.82497 4.01406 4.64706 4.11051 3.87868 4.87889C3.11032 5.64725 3.01385 6.82511 3.00174 9"
      stroke="#9B3CC4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>);

const EmotionIcon = () => 
  (<svg viewBox="0 0 48 48" className="w-5 h-5">
    <g fill="none" stroke="#D44D8C" strokeLinejoin="round" strokeWidth="2.5">
      <path d="M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4S4 12.954 4 24s8.954 20 20 20Z" stroke="#D44D8C" />
      <path d="M31 18v1m-14-1v1m14 12s-2 4-7 4s-7-4-7-4" strokeLinecap="round" stroke="#D44D8C" />
    </g>
  </svg>
);

const JournalIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path d="M36 38.577H11.16a1.404 1.404 0 0 1-1.404-1.405V5.904c0-.775.628-1.404 1.404-1.404h24.842a2.245 2.245 0 0 1 2.244 2.245v29.587a2.245 2.245 0 0 1-2.244 2.245ZM13.571 4.5v34.077M25.859 4.504v20.218m6.678-.064V4.504m-6.678 8.867H19.56m6.299 8.165H19.56m6.299-4.083H19.56"
      fill="none" stroke="#9B3CC4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M34.51 25.942a3.617 3.617 0 0 0-5.074-.658l-.117.09l-.117-.09a3.617 3.617 0 1 0-4.415 5.73l4.532 3.493l4.532-3.492a3.617 3.617 0 0 0 .658-5.074Zm-2.499 12.635V43.5l-2.744-1.533l-2.743 1.533v-4.923"
      fill="none" stroke="#9B3CC4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MeditateIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M12 2.75a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 0 0 0-3.5ZM8.75 4.5a3.25 3.25 0 1 1 6.5 0a3.25 3.25 0 0 1-6.5 0ZM12 9.77a5.9 5.9 0 0 0-.86.052l-.892.15c-2.013.339-3.498 2.102-3.498 4.178a3.25 3.25 0 0 1-1.43 2.696l-.1.069a3.43 3.43 0 0 1-.823.406l-1.157.39a.75.75 0 0 1-.48-1.422l1.159-.39c.163-.055.319-.132.462-.228l.102-.069a1.75 1.75 0 0 0 .767-1.452c0-2.797 2.003-5.195 4.748-5.657l.89-.15A7.273 7.273 0 0 1 12 8.271a7.255 7.255 0 0 1 1.112.072l.89.15c2.746.462 4.748 2.86 4.748 5.657c0 .586.29 1.13.768 1.452l.101.069c.144.096.3.173.463.228l1.158.39a.75.75 0 0 1-.48 1.422l-1.157-.39a3.429 3.429 0 0 1-.822-.406l-.101-.069a3.25 3.25 0 0 1-1.43-2.696c0-2.076-1.485-3.839-3.497-4.178l-.892-.15a5.886 5.886 0 0 0-.86-.051Zm-3.1 5.78a.75.75 0 1 1 1.2.9l-.924 1.233l-.022.029a4.531 4.531 0 0 1-.34.42a2.75 2.75 0 0 1-1.007.67c-.155.058-.316.098-.52.15l-.035.008l-1.794.449a.935.935 0 0 0 .227 1.841h.684c1.546 0 3.05-.501 4.287-1.429L12.55 18.4a.75.75 0 1 1 .9 1.2l-.904.678l.491.185c.534.2.775.29 1.017.366a9.252 9.252 0 0 0 2.243.407c.253.014.51.014 1.08.014h.939a.935.935 0 0 0 .226-1.841l-1.473-.369a96.02 96.02 0 0 0-.082-.02c-.476-.119-.851-.212-1.186-.406a2.73 2.73 0 0 1-.29-.192c-.308-.234-.54-.543-.833-.936l-.051-.067l-.727-.969a.75.75 0 1 1 1.2-.9l.727.969c.368.491.471.618.591.709c.042.031.086.06.132.087c.13.075.287.121.883.27l1.473.368a2.435 2.435 0 0 1-.59 4.797h-.963c-.539 0-.84 0-1.14-.017a10.753 10.753 0 0 1-2.607-.473c-.286-.09-.567-.195-1.072-.384l-1.432-.537a8.645 8.645 0 0 1-4.733 1.411h-.684a2.435 2.435 0 0 1-.59-4.797l1.793-.448c.255-.064.324-.082.384-.105c.173-.066.33-.17.458-.304c.044-.047.088-.102.246-.313L8.9 15.55Z"
      fill="#C4703A" fillRule="evenodd" />
  </svg>
);


const featureCards = [
  {
    title: "Daily Reflections",
    desc: "Reflective prompts to help you slow down and observe your thoughts without judgment.",
    icon: DailyIcon,
    iconBg: "bg-[#9B3CC4]/10",
    iconBorder: "border-[#9B3CC4]/20",
  },
  
  {
    title: "Mood Tracking",
    desc: "Track your emotional patterns and identify triggers with beautiful visualizations.",
    icon: EmotionIcon,
    iconBg: "bg-[#D44D8C]/10",
    iconBorder: "border-[#D44D8C]/20",
  },
  {
    title: "Safe Journaling",
    desc: "A private, secure space to process your thoughts and feelings with guided prompts.",
    icon: JournalIcon,
    iconBg: "bg-[#9B3CC4]/10",
    iconBorder: "border-[#9B3CC4]/20",
  },
  {
    title: "Coping Exercises",
    desc: "Evidence-based breathing and mindfulness exercises to build emotional resilience.",
    icon: MeditateIcon,
    iconBg: "bg-[#F5A87A]/20",
    iconBorder: "border-[#F5A87A]/40",
  },
];

const scrollSteps = [
  {
    title: "A safe place for every feeling",
    body: "Write down your feelings and discover what emotions they carry. A safe journal where every note tells your story. Tag your emotions yourself or let the app recognize them for you. Share with your therapist whenever you feel ready!",
    img: journal_image,
  },
  {
    title: "Your Progress, made visible",
    body: "Growth is rarely sudden, it's built step by step. The Dashboard helps you see and appreciate those steps, turning daily efforts into a meaningful picture of your journey toward balance and self-understanding.",
    img: kitty,
  },
  {
    title: "Every day is a new chance to level up",
    body: "Pause with the Daily Quiz and turn inward. Each moment spent here is an invitation to deepen awareness and strengthen emotional control. Growth unfolds quietly. Be present, be patient, be gentle with yourself.",
    img: pucca,
  },
];

function FeatureScroller() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      function (entries) 
      {
        for (let i = 0; i < entries.length; i++) 
        {
          const entry = entries[i];
          if (entry.isIntersecting) 
            {
            const indexAsString = entry.target.getAttribute("data-step-index");
            const indexAsNumber = parseInt(indexAsString);

            if (!isNaN(indexAsNumber)) {
              setActiveStep(indexAsNumber);
            }
          }
        }
      },
      { threshold: 0.5 }
    );
    for (let i = 0; i < stepRefs.current.length; i++) {
      const element = stepRefs.current[i];
      if (element) {
        observer.observe(element);
      }
    }
  }, []);

  return (
    <section className="w-full bg-[#FEF2FF] py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-[#2D0A38]">
            Tools built around{" "}
            <span className="italic text-[#9B3CC4]">your journey</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-10">
          <aside className="sticky top-20 self-start">
            <div className="relative rounded-2xl p-6 aspect-[16/13] overflow-hidden">
              {scrollSteps.map(function (step, index) {
                let imageClass = "absolute inset-0 m-auto h-[80%] w-[90%] object-contain transition-opacity duration-1000 pointer-events-none select-none ";
                if (index === activeStep) {
                  imageClass = imageClass + "opacity-100";
                } else {
                  imageClass = imageClass + "opacity-0";
                }
                return (
                  <img key={index} src={step.img} alt="" className={imageClass} />
                );
              })}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {scrollSteps.map(function (step, index) {
                let dotClass = "h-1.5 rounded-full transition-all duration-300 ";
                if (index === activeStep) {
                  dotClass = dotClass + "w-6 bg-gradient-to-r from-[#9B3CC4] to-[#D44D8C]";
                } else {
                  dotClass = dotClass + "w-1.5 bg-[#9B3CC4]/25";
                }
                return <div key={index} className={dotClass}></div>;
              })}
            </div>
          </aside>
          <main className="flex flex-col space-y-32">
            {scrollSteps.map(function (step, index) {
              return (
                <section
                  key={index}
                  ref={function (el) {
                    if (el) {
                      stepRefs.current[index] = el;
                    }
                  }}
                  data-step-index={index}
                  className="min-h-[60vh] flex items-center">
                  <div className="max-w-prose">
                    <h3 className="text-2xl font-bold text-[#2D0A38] leading-snug mb-4">
                      {step.title}
                    </h3>
                    <p className="text-[#7A4A8A] leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </section>
              );
            })}
          </main>

        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const currentYear = new Date().getFullYear();
  return (
    <div className="min-h-screen bg-[#FDF6FF]">
      <nav className="sticky top-0 z-40 h-15 px-6 py-3
                      flex items-center justify-between
                      bg-[#FDF6FF]/85 backdrop-blur-md
                      border-b border-[#9B3CC4]/10">
        <img src={logo} alt="Deeplyn logo" className="h-9 w-auto" />
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm text-[#7A4A8A] hover:text-[#9B3CC4] transition-colors">
            Sign in
          </Link>
          <Link to="/choice" className="text-sm font-medium text-white px-5 py-2 rounded-full
                                        bg-gradient-to-r from-[#9B3CC4] to-[#D44D8C]
                                        hover:opacity-90 hover:shadow-lg hover:shadow-[#9B3CC4]/30
                                        transition-all duration-200">
            Get started
          </Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24
                          flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col items-start gap-5">
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold text-[#2D0A38]
                         leading-tight tracking-tight">
            Start your journey with{" "}
            <span className="bg-gradient-to-r from-[#9B3CC4] to-[#D44D8C]
                             bg-clip-text text-transparent">Deeplyn</span>
          </h1>
          <p className="text-base text-[#7A4A8A] leading-relaxed max-w-md">
            A platform built for people who feel deeply, designed with tools to understand your emotions,
            track your patterns, and connect with therapists who truly listen.
          </p>
          <div className="flex gap-3 flex-wrap mt-1">
            <Link to="/choice" className="hidden md:inline-flex items-center text-sm font-medium text-white
              px-7 py-3 rounded-full bg-gradient-to-r from-[#9B3CC4] to-[#D44D8C]
              hover:opacity-90 hover:shadow-lg hover:shadow-[#9B3CC4]/30 transition-all duration-200">
              Open your space
            </Link>
          </div>
        </div>
        <div className="flex-1 w-full flex justify-center">
          <img
            src={hero}
            alt=""
            className="w-full max-w-sm md:max-w-none h-64 sm:h-80 md:h-auto object-cover"
          />
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[#9B3CC4]/20 to-transparent" />
      <section className="py-20 px-4 bg-[#FDF6FF]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-[#2D0A38]">
              What makes Deeplyn{" "}
              <span className="italic text-[#9B3CC4]">different</span>
            </h2>
            <p className="mt-3 text-[#7A4A8A] max-w-xl mx-auto leading-relaxed">
              Designed for people who feel deeply - evidence-based tools and compassionate
              support, available whenever you need it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureCards.map(function (card, index) {
              const IconComponent = card.icon;
              return (
                <div key={index} className="bg-white rounded-2xl border border-[#9B3CC4]/10
                                            p-6 shadow-sm hover:-translate-y-1 hover:shadow-md
                                            hover:shadow-[#9B3CC4]/10 transition-all duration-250">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${card.iconBg} ${card.iconBorder}`}>
                    <IconComponent />
                  </div>
                  <h3 className="text-base font-semibold text-[#2D0A38] mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#7A4A8A] leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <FeatureScroller />
      <TherapistsSection />
      <div className="h-px bg-gradient-to-r from-transparent via-[#9B3CC4]/20 to-transparent" />
      <section className="bg-[#FDF6FF] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* <UsersRating /> */}
        </div>
      </section>
      <FooterLamma />
      <footer className="bg-[#F8EDFF] border-t border-[#9B3CC4]/10
                         py-6 text-center text-sm text-[#B090C0]">
        {currentYear} Deeplyn.
      </footer>

    </div>
  );
}
