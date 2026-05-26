import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   WE ARE ENERGY CO-OPERATIVE — SAVINGS CALCULATOR
   ═══════════════════════════════════════════════════════════════

   ── HOW TO KEEP THIS ACCURATE ───────────────────────────────
   Ofgem publishes new price cap rates every quarter (Jan, Apr,
   Jul, Oct). When that happens, update the four values in the
   OFGEM block below and push to GitHub. That's it.

   Official source:
   https://www.ofgem.gov.uk/information-consumers/energy-advice-households/energy-price-cap-explained

   ── OFGEM PRICE CAP CONFIG ── UPDATE EACH QUARTER ───────────
   Current period: Q2 2026 (1 April – 30 June 2026)
   Region used:    London / South East England
   Why London:     Our FAQ savings figures use London as the
                   stated location for baseline calculations.

   To find regional rates each quarter, go to:
   https://www.ofgem.gov.uk/check-if-energy-price-cap-affects-you
   and select London / South East.
═══════════════════════════════════════════════════════════════ */

const OFGEM = {
  period:              "Q2 2026 (April – June 2026)",
  unit_rate_pence:     24.70,    // p/kWh electricity, London/South East, Direct Debit
  standing_pence_day:  61.64,    // p/day electricity standing charge, London/South East
  source:              "https://www.ofgem.gov.uk/information-consumers/energy-advice-households/energy-price-cap-explained",
};

/* ── WAE PUBLISHED SAVINGS BASELINE ─────────────────────────
   Source: We Are Energy FAQs page
   "Savings and costs are based on a comparison with the average
   latest Ofgem-quoted price cap for a London customer with no
   upfront contribution, consuming 2,855 kWh electricity,
   assuming bills rise by inflation at 2% per year and
   consumption rises 2.8% per year."

   We anchor the 10-year and 25-year projections to these
   published figures and scale proportionally.
   Year 1 is calculated live from current OFGEM rates.
─────────────────────────────────────────────────────────── */
const WAE_BASELINE = {
  kWh_per_year:  2855,    // consumption used in WAE's calculations
  saving_10yr:   6500,    // £ saved in first 10 years at baseline
  saving_25yr:   20000,   // £ saved over 25 years at baseline
};

/* ── OFGEM TYPICAL DOMESTIC CONSUMPTION VALUES (TDCVs) ──────
   Ofgem's current benchmark values (updated Oct 2023)
   Electricity only (not including gas)
   Source: https://www.ofgem.gov.uk/average-gas-and-electricity-use-explained
─────────────────────────────────────────────────────────── */
const PRESETS = [
  { label: "Studio / 1-bed",      sub: "~1,100 kWh/yr · Ofgem low",    kWh: 1100 },
  { label: "Small home",          sub: "~1,800 kWh/yr · Ofgem low",    kWh: 1800 },
  { label: "Typical home",        sub: "~2,700 kWh/yr · Ofgem medium", kWh: 2700, highlight: true },
  { label: "Larger home",         sub: "~4,100 kWh/yr · Ofgem high",   kWh: 4100 },
  { label: "All-electric / EV",   sub: "~5,500 kWh/yr · high usage",   kWh: 5500 },
];

/* ── HELPERS ─────────────────────────────────────────────── */
function annualBill(kWh) {
  return (kWh * OFGEM.unit_rate_pence / 100) + (OFGEM.standing_pence_day * 365 / 100);
}

function calcSavings(kWh) {
  const bill  = annualBill(kWh);
  const scale = kWh / WAE_BASELINE.kWh_per_year;

  // Year 1: directly from current cap (50% price promise)
  const year1 = Math.round(bill * 0.50);

  // 10-yr and 25-yr: anchored to WAE's published figures, scaled by kWh
  const yr10  = Math.round(WAE_BASELINE.saving_10yr * scale);
  const yr25  = Math.round(WAE_BASELINE.saving_25yr * scale);

  // Monthly bill at current cap for display
  const monthly = Math.round(bill / 12);

  return { year1, yr10, yr25, monthly, annualBill: Math.round(bill) };
}

function fmt(n) { return Math.round(n).toLocaleString("en-GB"); }

function useCount(target, ms = 1100) {
  const [v, setV] = useState(0);
  const raf = useRef(null);
  const t0  = useRef(null);
  const from = useRef(0);
  useEffect(() => {
    from.current = v;
    t0.current   = null;
    cancelAnimationFrame(raf.current);
    function tick(ts) {
      if (!t0.current) t0.current = ts;
      const p    = Math.min((ts - t0.current) / ms, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(Math.round(from.current + (target - from.current) * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return v;
}

const C = {
  chartreuse:   "#c0d726",
  coral:        "#f26b5b",
  charcoal:     "#373838",
  cream:        "#f1eee6",
  dark:         "#1e2120",
  creamSoft:    "rgba(241,238,230,0.82)",
  creamDim:     "rgba(241,238,230,0.45)",
  creamFaint:   "rgba(241,238,230,0.12)",
  greenLine:    "rgba(192,215,38,0.18)",
  greenFaint:   "rgba(192,215,38,0.06)",
};

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function Calculator() {
  // Default to Ofgem medium TDCV (2,700 kWh/yr)
  const [kWh,    setKwh]    = useState(2700);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const s      = calcSavings(kWh);
  const aY1    = useCount(s.year1,  900);
  const aY10   = useCount(s.yr10,  1200);
  const aY25   = useCount(s.yr25,  1500);

  // Slider maps to kWh directly for accuracy
  const sliderMin = 800;
  const sliderMax = 6000;

  function handleShare() {
    const msg =
      `I could save £${fmt(s.yr25)} over 25 years with We Are Energy Co-operative — ` +
      `solar and battery storage at zero upfront cost. 🌱☀️ weareenergy.coop ` +
      `#ClimateEmergency #EnergyDemocracy`;
    if (navigator.share) {
      navigator.share({
        title: "My We Are Energy savings estimate",
        text:  msg,
        url:   "https://WeAreEnergy.coop",
      });
    } else {
      navigator.clipboard.writeText(msg).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
    setShared(true);
  }

  return (
    <div style={{ fontFamily: "'Oswald',sans-serif", background: C.charcoal, color: C.cream, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        input[type=range]{-webkit-appearance:none;width:100%;height:5px;background:rgba(241,238,230,0.12);border-radius:3px;outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:${C.chartreuse};border:3px solid ${C.charcoal};box-shadow:0 0 0 2px ${C.chartreuse};}
        input[type=range]::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:${C.chartreuse};border:3px solid ${C.charcoal};}
        .pbtn{transition:border-color .15s,color .15s,background .15s;}
        .pbtn:hover{border-color:${C.chartreuse}!important;color:${C.chartreuse}!important;}
        .pbtn.active:hover{color:${C.charcoal}!important;}
      `}</style>

      {/* ── Header ── */}
      <header style={{ background: C.dark, padding: "1rem 1.5rem", borderBottom: `1px solid ${C.greenLine}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase", color: C.chartreuse, marginBottom: "0.15rem" }}>
            We Are Energy Co-operative
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Savings Calculator
          </div>
        </div>
        <a href="https://WeAreEnergy.coop" target="_blank" rel="noopener noreferrer"
           style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.chartreuse, textDecoration: "none", opacity: 0.7 }}>
          WeAreEnergy.coop ↗
        </a>
      </header>

      <main style={{ flex: 1, padding: "1.75rem 1.25rem", maxWidth: 620, margin: "0 auto", width: "100%" }}>

        {/* Intro */}
        <p style={{ fontFamily: "'PT Serif',serif", fontSize: "0.97rem", lineHeight: 1.65, color: C.creamSoft, marginBottom: "1.75rem", textAlign: "center" }}>
          Our model is designed to supply solar panels and battery storage at{" "}
          <strong style={{ color: C.cream }}>zero upfront cost</strong> — with your electricity
          bills capped at 50% of the Ofgem price for the first 8 years. Select your typical
          usage below to see what you could save once we launch in your area.
        </p>

        {/* ── Input block ── */}
        <div style={{ background: C.dark, borderRadius: 8, padding: "1.5rem", marginBottom: "1.1rem" }}>

          {/* kWh label */}
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: C.creamDim, marginBottom: "0.5rem" }}>
            Annual electricity use (kWh/year)
          </div>

          {/* Big number */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "2.6rem", fontWeight: 700, color: C.chartreuse, lineHeight: 1 }}>
              {kWh.toLocaleString("en-GB")} kWh
            </span>
          </div>
          <div style={{ fontFamily: "'PT Serif',serif", fontSize: "0.75rem", color: "rgba(241,238,230,0.35)", marginBottom: "1.25rem" }}>
            ≈ £{fmt(s.monthly)}/month · £{fmt(s.annualBill)}/year at current Ofgem cap &nbsp;
            <span style={{ color: C.chartreuse, opacity: 0.7 }}>({OFGEM.period})</span>
          </div>

          <input
            type="range" min={sliderMin} max={sliderMax} step={50}
            value={kWh}
            onChange={e => setKwh(Number(e.target.value))}
            aria-label="Annual electricity use in kWh"
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", marginBottom: "1.4rem" }}>
            <span style={{ fontSize: "0.57rem", color: "rgba(241,238,230,0.25)", letterSpacing: "0.07em" }}>800 kWh/yr</span>
            <span style={{ fontSize: "0.57rem", color: "rgba(241,238,230,0.25)", letterSpacing: "0.07em" }}>6,000 kWh/yr</span>
          </div>

          {/* Presets — Ofgem TDCVs */}
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(241,238,230,0.3)", marginBottom: "0.6rem" }}>
            Ofgem typical domestic consumption values (TDCVs)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {PRESETS.map(p => {
              const active = kWh === p.kWh;
              return (
                <button key={p.label}
                  className={`pbtn${active ? " active" : ""}`}
                  onClick={() => setKwh(p.kWh)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: 99,
                    border: `1px solid ${active ? C.chartreuse : "rgba(241,238,230,0.15)"}`,
                    background: active ? C.chartreuse : "transparent",
                    color: active ? C.charcoal : C.creamSoft,
                    fontFamily: "'Oswald',sans-serif",
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.08rem",
                    lineHeight: 1.25,
                  }}
                >
                  <span>{p.label}</span>
                  <span style={{ fontFamily: "'PT Serif',serif", fontStyle: "italic", fontSize: "0.6rem", fontWeight: 400, textTransform: "none", letterSpacing: 0, opacity: active ? 0.75 : 0.55 }}>
                    {p.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
          {[
            { label: "Year 1 estimate",  val: aY1,  note: "50% off Ofgem cap, year one",  accent: C.coral,       sub: "live Ofgem rates" },
            { label: "10-year estimate", val: aY10, note: "inc. 2 yrs of free generation", accent: C.chartreuse, sub: "WAE published basis" },
            { label: "25-year estimate", val: aY25, note: "25-yr system guarantee",        accent: C.chartreuse, sub: "WAE published basis" },
          ].map(item => (
            <div key={item.label} style={{ background: C.dark, borderRadius: 7, padding: "1rem 0.75rem", textAlign: "center", border: "1px solid rgba(241,238,230,0.06)" }}>
              <div style={{ fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: C.creamDim, marginBottom: "0.4rem", lineHeight: 1.35 }}>
                {item.label}
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 700, color: item.accent, lineHeight: 1, marginBottom: "0.35rem" }}>
                £{fmt(item.val)}
              </div>
              <div style={{ fontFamily: "'PT Serif',serif", fontSize: "0.6rem", color: "rgba(241,238,230,0.32)", lineHeight: 1.4 }}>
                {item.note}
              </div>
            </div>
          ))}
        </div>

        {/* ── Methodology note ── */}
        <div style={{ background: C.greenFaint, border: `1px solid ${C.greenLine}`, borderRadius: 7, padding: "1rem 1.2rem", marginBottom: "1.1rem" }}>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(192,215,38,0.7)", marginBottom: "0.4rem" }}>
            How these figures are calculated
          </div>
          <p style={{ fontFamily: "'PT Serif',serif", fontSize: "0.73rem", color: C.creamDim, lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: C.cream, fontFamily: "'Oswald',sans-serif", fontWeight: 500, letterSpacing: "0.03em" }}>Year 1</strong> is calculated directly from the current Ofgem electricity price cap
            for London / South East ({OFGEM.period}: {OFGEM.unit_rate_pence}p/kWh + {OFGEM.standing_pence_day}p/day standing charge),
            at We Are Energy's 50% price promise.{" "}
            <strong style={{ color: C.cream, fontFamily: "'Oswald',sans-serif", fontWeight: 500, letterSpacing: "0.03em" }}>10 and 25-year figures</strong> scale from
            We Are Energy's published estimate of £6,500 saved in 10 years and £20,000 over
            25 years for a London customer using 2,855 kWh/year — assuming 2% annual bill
            inflation and 2.8% annual consumption growth (source: We Are Energy FAQs). These
            are illustrative estimates. Your actual savings will depend on your location, usage,
            roof size, and future Ofgem cap levels.
          </p>
        </div>

        {/* ── Foundation phase note ── */}
        <div style={{ background: "rgba(242,107,91,0.06)", border: "1px solid rgba(242,107,91,0.2)", borderRadius: 7, padding: "1rem 1.2rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(242,107,91,0.8)", marginBottom: "0.35rem" }}>
            Founding Phase
          </div>
          <p style={{ fontFamily: "'PT Serif',serif", fontSize: "0.73rem", color: C.creamDim, lineHeight: 1.6, margin: 0 }}>
            We Are Energy is currently in its founding phase — raising the capital and founding
            members needed to begin UK installations. Register your interest now at no cost and
            with no obligation. We will contact you when we are ready to launch in your area.
          </p>
        </div>

        {/* ── CTAs ── */}
        <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <a href="https://WeAreEnergy.coop#register" target="_blank" rel="noopener noreferrer"
             style={{ flex: "1 1 180px", display: "block", padding: "0.95rem 1rem", borderRadius: 3, background: C.chartreuse, color: C.charcoal, fontFamily: "'Oswald',sans-serif", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", textAlign: "center" }}>
            Register Free →
          </a>
          <button onClick={handleShare}
             style={{ flex: "1 1 150px", padding: "0.95rem 1rem", borderRadius: 3, background: "transparent", color: copied ? C.chartreuse : C.creamSoft, border: `1.5px solid ${copied ? C.chartreuse : "rgba(241,238,230,0.2)"}`, fontFamily: "'Oswald',sans-serif", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}>
            {copied ? "✓ Copied" : "Share My Estimate"}
          </button>
        </div>

        {shared && !copied && (
          <p style={{ fontFamily: "'PT Serif',serif", fontSize: "0.78rem", color: C.chartreuse, textAlign: "center", opacity: 0.8 }}>
            Every share helps grow the co-operative. Thank you.
          </p>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: C.dark, padding: "1rem 1.5rem", borderTop: "1px solid rgba(241,238,230,0.07)", textAlign: "center" }}>
        <p style={{ fontFamily: "'PT Serif',serif", fontSize: "0.65rem", color: "rgba(241,238,230,0.28)", lineHeight: 1.6 }}>
          We Are Energy Co-operative Limited · FCA Reg. 4686 · Registered under the Co-operative and Community Benefit Societies Act 2014
          {" "}·{" "}
          Ofgem cap data: <a href={OFGEM.source} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(192,215,38,0.5)", textDecoration: "none" }}>ofgem.gov.uk</a>
          {" "}·{" "}
          <a href="https://WeAreEnergy.coop/faqs.html" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(192,215,38,0.5)", textDecoration: "none" }}>FAQs</a>
          {" "}·{" "}
          <a href="https://WeAreEnergy.coop/press.html" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(192,215,38,0.5)", textDecoration: "none" }}>Press</a>
        </p>
      </footer>
    </div>
  );
}
