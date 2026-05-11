import React, { useMemo, useState } from "react";

export default function UsersSay() {
  const items = useMemo(
    () => [
      {
        id: 1,
        name: "Simona",
        age: 23,
        quote:
          "I was skeptical at first, but this app changed how I see myself. The daily quiz helps me notice my feelings, and earning XP makes progress feel rewarding.",
        avatar: "/images/avatars/user1.jpg",
      },
      {
        id: 2,
        name: "Alex",
        age: 27,
        quote:
          "The dashboard turned noise into signal. I can finally see trends instead of guesswork.",
        avatar: "/images/avatars/user2.jpg",
      },
      {
        id: 3,
        name: "Mara",
        age: 19,
        quote:
          "Gentle guidance without judgment. It's the first time I truly feel growth with my emotions.",
        avatar: "/images/avatars/user3.jpg",
      },
      {
        id: 4,
        name: "Radu",
        age: 31,
        quote:
          "Tiny wins compound. The journal + XP loop keeps me consistent.",
        avatar: "/images/avatars/user4.jpg",
      },
      {
        id: 5,
        name: "Ioana",
        age: 25,
        quote:
          "Simple, kind, and effective. I feel supported 24/7, not just during sessions.",
        avatar: "/images/avatars/user5.jpg",
      },
      {
        id: 6,
        name: "Vlad",
        age: 29,
        quote:
          "The chatbot is a safe anchor on tough days. That alone is priceless.",
        avatar: "/images/avatars/user6.jpg",
      },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const a = items[active];

  return (
    <section className="w-full bg-[#F7F7FB] py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        {/* Heading */}
        <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1e2652]">
          What our{" "}
          <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#8D57CB,#CC23A2)]">
            Users
          </span>{" "}
          say
        </h2>

        {/* Stage */}
        <div className="relative mx-auto mt-10 sm:mt-12 lg:mt-16 max-w-5xl">
          {/* Cercul central cu testimonial */}
          <div
            className="mx-auto aspect-square max-w-[520px] rounded-full bg-white shadow-xl ring-1 ring-black/5
                       flex items-center justify-center p-8 sm:p-10"
            aria-live="polite"
          >
            <figure className="max-w-[38ch] text-center">
              <blockquote className="text-sm sm:text-base text-[#343a5a] italic leading-relaxed">
                “{a.quote}”
              </blockquote>
              <figcaption className="mt-4 text-xs sm:text-sm text-[#6b7280]">
                — {a.name}, {a.age}
              </figcaption>
            </figure>
          </div>

          {/* Avatar-uri laterale | vizibile de la md în sus */}
          <div className="hidden md:block">
            {/* stânga sus */}
            <AvatarDot
              className="absolute top-[8%] left-[6%]"
              item={items[0]}
              isActive={active === 0}
              onClick={() => setActive(0)}
            />
            {/* stânga mijloc */}
            <AvatarDot
              className="absolute top-[42%] left-[4%]"
              item={items[1]}
              isActive={active === 1}
              onClick={() => setActive(1)}
            />
            {/* stânga jos */}
            <AvatarDot
              className="absolute bottom-[8%] left-[6%]"
              item={items[2]}
              isActive={active === 2}
              onClick={() => setActive(2)}
            />

            {/* dreapta sus */}
            <AvatarDot
              className="absolute top-[8%] right-[6%]"
              item={items[3]}
              isActive={active === 3}
              onClick={() => setActive(3)}
            />
            {/* dreapta mijloc */}
            <AvatarDot
              className="absolute top-[42%] right-[4%]"
              item={items[4]}
              isActive={active === 4}
              onClick={() => setActive(4)}
            />
            {/* dreapta jos */}
            <AvatarDot
              className="absolute bottom-[8%] right-[6%]"
              item={items[5]}
              isActive={active === 5}
              onClick={() => setActive(5)}
            />
          </div>

          {/* Pe mobile: avatar-urile sub cerc, scroll orizontal ușor */}
          <div className="md:hidden mt-8 flex items-center justify-center gap-4 overflow-x-auto no-scrollbar">
            {items.map((it, i) => (
              <AvatarButton
                key={it.id}
                item={it}
                isActive={active === i}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* === componente mici reutilizabile === */

function AvatarDot({ className = "", item, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group size-16 xl:size-20 rounded-full bg-white shadow-md ring-1 ring-black/5",
        "flex items-center justify-center",
        "transition transform hover:scale-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
        className,
      ].join(" ")}
      aria-pressed={isActive}
      aria-label={`${item.name}, ${item.age}`}
      title={`${item.name}, ${item.age}`}
    >
      <img
        src={item.avatar}
        alt={`${item.name}`}
        className="size-12 xl:size-14 rounded-full object-cover"
        loading="lazy"
      />
    </button>
  );
}

function AvatarButton({ item, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-shrink-0 size-14 rounded-full bg-white shadow-md ring-1 ring-black/5",
        "flex items-center justify-center",
        isActive ? "ring-2 ring-fuchsia-400" : "",
      ].join(" ")}
      aria-pressed={isActive}
      aria-label={`${item.name}, ${item.age}`}
      title={`${item.name}, ${item.age}`}
    >
      <img
        src={item.avatar}
        alt={`${item.name}`}
        className="size-10 rounded-full object-cover"
        loading="lazy"
      />
    </button>
  );
}
