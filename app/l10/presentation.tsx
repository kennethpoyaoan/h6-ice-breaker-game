"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const slides = [
  { id: "cover", label: "High6" },
  { id: "mission", label: "Mission" },
  { id: "vision", label: "Vision" },
  { id: "purpose", label: "Purpose" },
  { id: "values", label: "Core Values" },
  { id: "uniqueness", label: "Uniqueness" },
  { id: "guarantee", label: "Guarantee" },
  { id: "thanks", label: "Thank You" },
] as const;

export function L10Presentation() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const touchStart = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    const target = Math.max(0, Math.min(slides.length - 1, next));
    setActive((current) => {
      setDirection(target >= current ? "next" : "prev");
      return target;
    });
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        setActive((current) => {
          setDirection("next");
          return Math.min(slides.length - 1, current + 1);
        });
      }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setActive((current) => {
          setDirection("prev");
          return Math.max(0, current - 1);
        });
      }
      if (event.key === "Home") go(0);
      if (event.key === "End") go(slides.length - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <main
      className="l10"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta =
          touchStart.current -
          (event.changedTouches[0]?.clientX ?? touchStart.current);
        if (Math.abs(delta) > 55) go(active + (delta > 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div className="l10-grid" />
      <div className="l10-glow glow-a" />
      <div className="l10-glow glow-b" />
      <header className="l10-header">
        <div className="h6-logo">
          <Image
            src="/high6-logo.png"
            width={150}
            height={50}
            alt="High6"
            priority
          />
        </div>
        <div className="l10-section">L10 · {slides[active].label}</div>
        <button
          className="fullscreen-button"
          title="Enter fullscreen"
          aria-label="Enter fullscreen"
          onClick={() => void document.documentElement.requestFullscreen?.()}
        >
          ⛶
        </button>
      </header>

      <section
        className={`slide-frame direction-${direction}`}
        key={slides[active].id}
        aria-live="polite"
      >
        {active === 0 && <CoverSlide />}
        {active === 1 && (
          <StatementSlide
            number="01"
            kicker="Our Mission"
            words={["Make technology", "feel simple"]}
            body="So businesses can grow with confidence."
            accent="lime"
          />
        )}
        {active === 2 && (
          <StatementSlide
            number="02"
            kicker="Our Vision"
            words={["Innovate freely.", "Grow fearlessly."]}
            body="A world where every business can innovate freely, unburdened by the complexity of technology."
            accent="violet"
          />
        )}
        {active === 3 && <PurposeSlide />}
        {active === 4 && <ValuesSlide />}
        {active === 5 && <UniquenessSlide />}
        {active === 6 && <GuaranteeSlide />}
        {active === 7 && <ThanksSlide />}
      </section>

      <footer className="l10-controls">
        <div className="slide-count">
          <strong>{String(active + 1).padStart(2, "0")}</strong>
          <span>/ {String(slides.length).padStart(2, "0")}</span>
        </div>
        <div className="progress-track">
          <i style={{ width: `${((active + 1) / slides.length) * 100}%` }} />
        </div>
        <div className="nav-buttons">
          <button
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label="Previous slide"
          >
            ←
          </button>
          <button
            onClick={() => go(active + 1)}
            disabled={active === slides.length - 1}
            aria-label="Next slide"
          >
            →
          </button>
        </div>
      </footer>
    </main>
  );
}

function CoverSlide() {
  return (
    <div className="cover-slide">
      <div className="cover-copy">
        <p className="slide-kicker reveal-1">High6 · L10</p>
        <h1 className="reveal-2">
          Technology
          <br />
          <em>with purpose.</em>
        </h1>
        <p className="cover-sub reveal-3 mb-4">
          Who we are, what we value, and how we create lasting value together.
        </p>
        <p className="slide-kicker reveal-1">BY KENNETH POYAOAN</p>
      </div>
      <div className="cover-mark reveal-2">
        <div className="six-ring">
          <Image
            className="cover-icon"
            src="/high6-mark.png"
            width={300}
            height={300}
            alt="High6 hand mark"
            priority
          />
        </div>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <small>GO BEYOND</small>
      </div>
    </div>
  );
}

function StatementSlide({
  number,
  kicker,
  words,
  body,
  accent,
}: {
  number: string;
  kicker: string;
  words: string[];
  body: string;
  accent: string;
}) {
  return (
    <div className={`statement-slide accent-${accent}`}>
      <div className="statement-number reveal-1">{number}</div>
      <div className="statement-copy">
        <p className="slide-kicker reveal-1">{kicker}</p>
        <h2 className="reveal-2">
          {words[0]}
          <br />
          <em>{words[1]}</em>
        </h2>
        <p className="statement-body reveal-3">{body}</p>
      </div>
      <div className="statement-art reveal-3">
        <i />
        <i />
        <i />
        <span>✦</span>
      </div>
    </div>
  );
}

function PurposeSlide() {
  const points = [
    "Help companies gain competitive advantage in the market by providing a targeted and effective digital solutions.",
    "As value progresses so thus the company's process, team members' skills and output.",
    "“H6 Touch” should always gives “Value”",
  ];
  return (
    <div className="content-slide">
      <div className="content-heading">
        <p className="slide-kicker reveal-1">03 · Our Purpose</p>
        <h2 className="reveal-2">
          Creating
          <br />
          <em>lasting value.</em>
        </h2>
        <p className="reveal-3">For every stakeholder we serve.</p>
      </div>
      <div className="purpose-list">
        {points.map((point, index) => (
          <article
            style={
              { "--delay": `${0.18 + index * 0.1}s` } as React.CSSProperties
            }
            key={point}
          >
            <span>0{index + 1}</span>
            <p>{point}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ValuesSlide() {
  const values = [
    ["Win-win", "Everybody wins—customers, teammates, and investors."],
    ["Kaizen", "Pursue continuous learning."],
    [
      "Extra Mile",
      "Level up in our service and output. That's why we are named high6 and not high5.",
    ],
    ["Victor Mentality", "Be responsible and not lay blame."],
    [
      "Integrity",
      "Act honestly, keep commitments, and do what is right—even when it is difficult.",
    ],
    [
      "Work Smart",
      "Use systems, AI, and clear priorities to work efficiently and sustainably without burnout.",
    ],
  ];
  return (
    <div className="values-slide">
      <div className="wide-heading">
        <p className="slide-kicker reveal-1">04 · Our Foundation</p>
        <h2 className="reveal-2">
          High6 <em>Core Values</em>
        </h2>
      </div>
      <div className="values-grid">
        {values.map(([title, body], index) => (
          <article
            style={
              { "--delay": `${0.12 + index * 0.07}s` } as React.CSSProperties
            }
            key={title}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function UniquenessSlide() {
  const items = [
    [
      "We are a development company",
      "We are knowledgeable not only building websites but web applications as well.",
    ],
    ["Training background", "We understand business, learning, and flow."],
    ["We have our internal system", "To track tickets and tasks."],
    ["We are flexible", "In handling customer requests (Aftersales)."],
  ];
  return (
    <div className="uniqueness-slide">
      <div className="wide-heading">
        <p className="slide-kicker reveal-1">05 · Uniqueness</p>
        <h2 className="reveal-2">
          Built to be
          <br />
          <em>different.</em>
        </h2>
      </div>
      <div className="unique-stack">
        {items.map(([title, body], index) => (
          <article
            style={
              { "--delay": `${0.15 + index * 0.1}s` } as React.CSSProperties
            }
            key={title}
          >
            <span>0{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
            <b>↗</b>
          </article>
        ))}
      </div>
    </div>
  );
}

function GuaranteeSlide() {
  return (
    <div className="guarantee-slide">
      <p className="slide-kicker reveal-1">06 · Our Guarantee</p>
      <div className="promise reveal-2">
        <span>Overdeliver</span>
        <i>the</i>
        <strong>Promise.</strong>
      </div>
      <div className="promise-line reveal-3">
        <i />
        <span>Expectations are the starting line—not the finish.</span>
      </div>
    </div>
  );
}

function ThanksSlide() {
  return (
    <div className="thanks-slide">
      <div className="thanks-star reveal-1">✦</div>
      <p className="slide-kicker reveal-1">Together, we go beyond</p>
      <h2 className="reveal-2">
        Thank <em>you.</em>
      </h2>
      <p className="reveal-3">Let’s create lasting value.</p>
      <div className="thanks-brand reveal-3">
        <Image src="/high6-logo.png" width={225} height={75} alt="High6" />
      </div>
    </div>
  );
}
