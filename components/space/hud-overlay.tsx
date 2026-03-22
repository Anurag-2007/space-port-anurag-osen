"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { PLANETS } from "./planet-data"
import { useSounds } from "./sound-engine"

interface HudOverlayProps {
  visible: boolean
  selectedPlanet: string | null
  onSelectPlanet: (id: string | null) => void
}

export function HudOverlay({ visible, selectedPlanet, onSelectPlanet }: HudOverlayProps) {
  const [showHud, setShowHud] = useState(false)
  const [missionTime, setMissionTime] = useState(0)
  const [velocity, setVelocity] = useState(7.66)
  const [altitude, setAltitude] = useState(400.2)
  const [signalStrength, setSignalStrength] = useState(98.2)
  const [showHelp, setShowHelp] = useState(false)
  const [helpLineIndex, setHelpLineIndex] = useState(0)
  const sounds = useSounds()

  // Smart awareness state
  const [awareness, setAwareness] = useState<string | null>(null)
  const awarenessTimeout = useRef<ReturnType<typeof setTimeout>>()
  const visitedPlanets = useRef<Set<string>>(new Set())
  const visitCounts = useRef<Record<string, number>>({})
  const lastScroll = useRef(Date.now())
  const scrollDelta = useRef(0)

  useEffect(() => {
    if (!visible) return
    setTimeout(() => {
      setShowHud(true)
      sounds.play("deep-space")
    }, 1000)
  }, [visible, sounds])

  useEffect(() => {
    if (!showHud) return
    const interval = setInterval(() => {
      setMissionTime((prev) => prev + 1)
      setVelocity(7.5 + Math.random() * 0.5)
      setAltitude(398 + Math.random() * 5)
      setSignalStrength(95 + Math.random() * 5)
    }, 1000)
    return () => clearInterval(interval)
  }, [showHud])

  // Track scroll speed for "high velocity" awareness
  useEffect(() => {
    if (!showHud) return
    const handleScroll = () => {
      const now = Date.now()
      const dt = now - lastScroll.current
      if (dt < 200) {
        scrollDelta.current++
        if (scrollDelta.current > 8) {
          showAwareness("HIGH VELOCITY NAVIGATION DETECTED")
          scrollDelta.current = 0
        }
      } else {
        scrollDelta.current = 0
      }
      lastScroll.current = now
    }
    window.addEventListener("wheel", handleScroll, { passive: true })
    return () => window.removeEventListener("wheel", handleScroll)
  }, [showHud])

  // Track planet visits for smart awareness
  useEffect(() => {
    if (!selectedPlanet || !showHud) return
    visitedPlanets.current.add(selectedPlanet)
    visitCounts.current[selectedPlanet] = (visitCounts.current[selectedPlanet] || 0) + 1

    // Check for repeated visits
    if (visitCounts.current[selectedPlanet] >= 3) {
      const planet = PLANETS.find((p) => p.id === selectedPlanet)
      showAwareness(`${planet?.name?.toUpperCase() || "SECTOR"} appears to be of primary interest`)
    }

    // Check for full exploration
    if (visitedPlanets.current.size === PLANETS.length) {
      setTimeout(() => showAwareness("SYSTEM EXPLORATION COMPLETE"), 2000)
    }
  }, [selectedPlanet, showHud])

  const showAwareness = useCallback((msg: string) => {
    setAwareness(msg)
    if (awarenessTimeout.current) clearTimeout(awarenessTimeout.current)
    awarenessTimeout.current = setTimeout(() => setAwareness(null), 4000)
  }, [])

  // Help guide typewriter
  useEffect(() => {
    if (!showHelp) {
      setHelpLineIndex(0)
      return
    }
    if (helpLineIndex >= HELP_LINES.length) return
    const timer = setTimeout(() => setHelpLineIndex((i) => i + 1), 120)
    return () => clearTimeout(timer)
  }, [showHelp, helpLineIndex])

  const toggleHelp = useCallback(() => {
    sounds.play("scan")
    setShowHelp((h) => !h)
  }, [sounds])

  if (!visible) return null

  const formatTime = (seconds: number) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0")
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")
    const s = String(seconds % 60).padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  return (
    <div
      className={`fixed inset-0 z-30 pointer-events-none transition-opacity duration-1000 ${
        showHud ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Top HUD bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 md:px-6 py-2 md:py-3 pointer-events-auto">
        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="glass-panel rounded px-2 md:px-3 py-1 md:py-1.5 flex items-center gap-1.5 md:gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-[8px] md:text-[10px] text-foreground uppercase tracking-widest">
              ACTIVE
            </span>
          </div>
          <div className="hidden sm:block glass-panel rounded px-2 md:px-3 py-1 md:py-1.5">
            <span className="font-mono text-[8px] md:text-[10px] text-muted-foreground tracking-wider">
              {"MET: "}{formatTime(missionTime)}
            </span>
          </div>
          <div className="hidden md:block glass-panel rounded px-3 py-1.5">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
              {"SIG: "}{signalStrength.toFixed(1)}{"dB"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="hidden sm:block glass-panel rounded px-2 md:px-3 py-1 md:py-1.5">
            <span className="font-mono text-[8px] md:text-[10px] text-muted-foreground tracking-wider">
              {"VEL: "}{velocity.toFixed(2)}
            </span>
          </div>
          <div className="hidden md:block glass-panel rounded px-3 py-1.5">
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
              {"ALT: "}{altitude.toFixed(1)}{"km"}
            </span>
          </div>
          <button
            onClick={toggleHelp}
            className={`glass-panel rounded px-2 md:px-3 py-1 md:py-1.5 cursor-pointer transition-all duration-300 ${
              showHelp ? "box-glow border-primary/50" : "hover:border-primary/40"
            }`}
            aria-label="Toggle help guide"
          >
            <span className="font-mono text-[8px] md:text-[10px] text-primary tracking-wider font-bold">
              {"[?] HELP"}
            </span>
          </button>
          <button
            onClick={() => {
              sounds.toggleMute()
              sounds.play("click")
            }}
            className="glass-panel rounded px-2 md:px-3 py-1 md:py-1.5 cursor-pointer hover:border-primary/40 transition-colors"
            aria-label={sounds.isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            <span className="font-mono text-[8px] md:text-[10px] text-muted-foreground tracking-wider">
              {"SFX: "}{sounds.isMuted ? "OFF" : "ON"}
            </span>
          </button>
        </div>
      </div>

      {/* Smart System Awareness Toast */}
      {awareness && (
        <div className="absolute top-14 md:top-16 left-1/2 -translate-x-1/2 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="glass-panel-bright rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-chart-4 animate-pulse" />
            <span className="font-mono text-[9px] md:text-[10px] text-chart-4 uppercase tracking-[0.15em]">
              {awareness}
            </span>
          </div>
        </div>
      )}

      {/* Help Guide Terminal Overlay */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={toggleHelp}
          />
          <div className="relative glass-panel-bright rounded-lg w-[calc(100vw-32px)] max-w-lg max-h-[80vh] overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4 pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-xs md:text-sm text-primary uppercase tracking-[0.2em] font-bold text-glow">
                  ASTRONAUT GUIDE
                </span>
              </div>
              <button
                onClick={toggleHelp}
                className="font-mono text-xs text-muted-foreground hover:text-primary cursor-pointer"
                aria-label="Close help"
              >
                {"[X]"}
              </button>
            </div>
            <div className="space-y-1 font-mono text-[10px] md:text-xs leading-relaxed">
              {HELP_LINES.map((line, i) => (
                <div
                  key={i}
                  className={`transition-all duration-200 ${
                    i <= helpLineIndex ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                  } ${line.type === "header" ? "text-primary font-bold mt-3 text-glow" : ""} ${
                    line.type === "hint" ? "text-chart-4" : ""
                  } ${line.type === "normal" ? "text-foreground/70" : ""} ${
                    line.type === "separator" ? "text-border/40" : ""
                  }`}
                >
                  {line.text}
                </div>
              ))}
              {helpLineIndex < HELP_LINES.length && (
                <span className="inline-block w-2 h-3 bg-primary animate-pulse ml-1" />
              )}
            </div>
            <div className="mt-4 pt-2 border-t border-border/30 flex items-center justify-between">
              <span className="font-mono text-[8px] text-muted-foreground/40 uppercase tracking-widest">
                MISSION CONTROL MANUAL v3.0
              </span>
              <span className="font-mono text-[8px] text-muted-foreground/40">
                {"ESC or [X] to close"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Left nav - planet selector */}
      <nav
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1 md:gap-2 pointer-events-auto max-h-[60vh] overflow-y-auto"
        aria-label="Planet navigation"
      >
        {PLANETS.map((planet) => (
          <button
            key={planet.id}
            onClick={() => {
              sounds.play("click")
              onSelectPlanet(selectedPlanet === planet.id ? null : planet.id)
            }}
            onMouseEnter={() => sounds.play("hover")}
            className={`
              glass-panel rounded px-2 md:px-3 py-1 md:py-2 flex items-center gap-1.5 md:gap-2 transition-all duration-300 cursor-pointer
              hover:border-primary/40
              ${selectedPlanet === planet.id ? "box-glow border-primary/50" : ""}
            `}
            aria-label={`Navigate to ${planet.name}`}
          >
            <span
              className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0"
              style={{ backgroundColor: planet.color }}
            />
            <span
              className={`font-mono text-[8px] md:text-[10px] uppercase tracking-widest ${
                selectedPlanet === planet.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {planet.name}
            </span>
            {selectedPlanet === planet.id && (
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse ml-auto" />
            )}
            {/* Visit indicator */}
            {visitedPlanets.current.has(planet.id) && selectedPlanet !== planet.id && (
              <span className="w-1 h-1 rounded-full bg-accent/50 ml-auto" />
            )}
          </button>
        ))}
      </nav>

      {/* Right mini-map */}
      <div className="absolute right-2 md:right-6 bottom-12 md:bottom-16 pointer-events-none">
        <div className="glass-panel rounded-lg p-2 md:p-3 w-16 h-16 md:w-24 md:h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="2" fill="rgba(0,200,220,0.8)" />
            {PLANETS.map((p) => {
              const r = (p.orbitRadius / 65) * 45
              return (
                <circle
                  key={p.id}
                  cx={50}
                  cy={50}
                  r={r}
                  fill="none"
                  stroke={selectedPlanet === p.id ? p.color : "rgba(0,200,220,0.1)"}
                  strokeWidth={selectedPlanet === p.id ? 1 : 0.3}
                />
              )
            })}
            <circle cx="85" cy="20" r="2" fill="rgba(255,68,0,0.5)" />
          </svg>
          <div className="text-center mt-0.5 md:mt-1">
            <span className="font-mono text-[6px] md:text-[7px] text-muted-foreground/40 uppercase tracking-wider">
              System Map
            </span>
          </div>
        </div>
      </div>

      {/* Exploration progress */}
      <div className="absolute right-2 md:right-6 bottom-[7.5rem] md:bottom-[10rem] pointer-events-none">
        <div className="glass-panel rounded px-2 py-1.5">
          <div className="font-mono text-[7px] md:text-[8px] text-muted-foreground/40 uppercase tracking-widest mb-1">
            Explored
          </div>
          <div className="flex items-center gap-0.5">
            {PLANETS.map((p) => (
              <div
                key={p.id}
                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: visitedPlanets.current.has(p.id) ? p.color : "rgba(255,255,255,0.08)",
                }}
                title={p.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 md:gap-6 px-3 md:px-6 py-2 md:py-3 flex-wrap">
        <span className="font-mono text-[7px] md:text-[9px] text-muted-foreground/30 tracking-widest uppercase">
          Drag to orbit
        </span>
        <span className="font-mono text-[7px] md:text-[9px] text-muted-foreground/30">|</span>
        <span className="font-mono text-[7px] md:text-[9px] text-muted-foreground/30 tracking-widest uppercase">
          Scroll to zoom
        </span>
        <span className="hidden sm:inline font-mono text-[9px] text-muted-foreground/30">|</span>
        <span className="hidden sm:inline font-mono text-[9px] text-muted-foreground/30 tracking-widest uppercase">
          WASD / QE to navigate
        </span>
        <span className="hidden md:inline font-mono text-[9px] text-muted-foreground/30">|</span>
        <span className="hidden md:inline font-mono text-[9px] text-muted-foreground/30 tracking-widest uppercase">
          Click planet to inspect
        </span>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-3 left-3 md:top-4 md:left-4 w-4 h-4 md:w-6 md:h-6 border-l border-t border-primary/20" />
      <div className="absolute top-3 right-3 md:top-4 md:right-4 w-4 h-4 md:w-6 md:h-6 border-r border-t border-primary/20" />
      <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 w-4 h-4 md:w-6 md:h-6 border-l border-b border-primary/20" />
      <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-4 h-4 md:w-6 md:h-6 border-r border-b border-primary/20" />

      {/* Crosshair center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-6 h-6 md:w-8 md:h-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1.5 md:h-2 bg-primary/15" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-1.5 md:h-2 bg-primary/15" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 md:w-2 h-px bg-primary/15" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 md:w-2 h-px bg-primary/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary/20" />
        </div>
      </div>

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute left-0 w-full h-px bg-primary/5 animate-scan-line" style={{ animationDuration: "8s" }} />
      </div>
    </div>
  )
}

const HELP_LINES: Array<{ text: string; type: "header" | "normal" | "hint" | "separator" }> = [
  { text: "> INITIALIZING ASTRONAUT TERMINAL v3.0...", type: "header" },
  { text: "========================================", type: "separator" },
  { text: "", type: "normal" },
  { text: "> NAVIGATION CONTROLS", type: "header" },
  { text: "  Mouse Drag / Touch    - Orbit camera", type: "normal" },
  { text: "  Scroll / Pinch        - Zoom in/out", type: "normal" },
  { text: "  W/A/S/D or Arrows     - Rotate view", type: "normal" },
  { text: "  Q / E                 - Zoom in/out", type: "normal" },
  { text: "  ESC                   - Deselect / Close", type: "normal" },
  { text: "  Idle for 3s           - Camera micro-drift", type: "normal" },
  { text: "", type: "normal" },
  { text: "> PLANET INTERACTION", type: "header" },
  { text: "  Click planet to inspect data", type: "normal" },
  { text: "  Skills planet shows holographic panels!", type: "hint" },
  { text: "  Photography planet has a gallery carousel", type: "hint" },
  { text: "  Contact links are active hyperlinks", type: "hint" },
  { text: "", type: "normal" },
  { text: "> HIDDEN EASTER EGGS", type: "header" },
  { text: "  [!] BLACK HOLE: Click to spaghettify text", type: "hint" },
  { text: "  [!] BLACK HOLE: 3rd click reveals archive", type: "hint" },
  { text: "  [!] ROGUE PLANET: Zoom far out to find it", type: "hint" },
  { text: "  [!] TRIPLE-CLICK space for a secret msg", type: "hint" },
  { text: "  [!] Stay idle 20s for meteor shower", type: "hint" },
  { text: "  [!] Wait 70-120s for deep space signal", type: "hint" },
  { text: "", type: "normal" },
  { text: "> SMART SYSTEM AWARENESS", type: "header" },
  { text: "  Scroll fast       - Velocity alert", type: "normal" },
  { text: "  Visit all planets - Exploration complete", type: "normal" },
  { text: "  Revisit 3x        - Interest detected", type: "normal" },
  { text: "", type: "normal" },
  { text: "> AUDIO SYSTEM", type: "header" },
  { text: "  NASA-inspired spatial audio engine", type: "normal" },
  { text: "  Unique synth SFX per interaction", type: "normal" },
  { text: "  Toggle with SFX button (top-right)", type: "normal" },
  { text: "", type: "normal" },
  { text: "========================================", type: "separator" },
  { text: "> STATUS: ALL SYSTEMS NOMINAL", type: "header" },
  { text: "> EXPLORER, YOU ARE CLEARED FOR DEEP SPACE.", type: "hint" },
]
