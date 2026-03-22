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
  const [coreTemp, setCoreTemp] = useState(36.4)
  const [memUsage, setMemUsage] = useState(2.4)
  const [scrollLog, setScrollLog] = useState<string[]>([
    "[13:18:29.223] SYS.CORE > Initializing quantum nav matrix...",
    "[13:18:30.028] NAV.GPS > Calculating orbital trajectory...",
    "[13:18:30.819] COM.LINK > Establishing deep-space relay...",
    "[13:18:31.624] PWR.MAIN > Fusion reactor output: 98.7%",
    "[13:18:32.421] LIFE.SUP > Atmospheric support: nominal",
  ])
  const sounds = useSounds()
  const visitedPlanets = useRef<Set<string>>(new Set())
  const visitCounts = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!visible) return
    setTimeout(() => {
      setShowHud(true)
      sounds.play("deep-space-ambient")
    }, 1000)
  }, [visible, sounds])

  useEffect(() => {
    if (!showHud) return
    const interval = setInterval(() => {
      setMissionTime((prev) => prev + 1)
      setVelocity(7.5 + Math.random() * 0.5)
      setAltitude(398 + Math.random() * 5)
      setSignalStrength(95 + Math.random() * 5)
      setCoreTemp(35 + Math.random() * 3)
      setMemUsage(2 + Math.random() * 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [showHud])

  // Track planet visits
  useEffect(() => {
    if (!selectedPlanet || !showHud) return
    visitedPlanets.current.add(selectedPlanet)
    visitCounts.current[selectedPlanet] = (visitCounts.current[selectedPlanet] || 0) + 1
  }, [selectedPlanet, showHud])

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

  const formatDate = () => {
    const now = new Date()
    return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
  }

  const getCoordinates = () => {
    const angle = (missionTime * 5) % 360
    const lat = Math.sin(angle * Math.PI / 180) * 90
    const lon = Math.cos(angle * Math.PI / 180) * 180
    return { lat: lat.toFixed(2), lon: lon.toFixed(2) }
  }

  const coords = getCoordinates()

  return (
    <div
      className={`fixed inset-0 z-30 pointer-events-none transition-opacity duration-1000 ${
        showHud ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-background/20 backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-primary tracking-widest">SYS.ONLINE</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="font-mono text-xs text-primary">CORE TEMP: {coreTemp.toFixed(1)}C</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground tracking-widest">{formatDate()}</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">MEM: {memUsage.toFixed(1)}GB/4TB</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="font-mono text-xs text-primary">SEC.LVL: ALPHA_●</span>
        </div>
      </div>

      {/* CENTER TITLE SECTION */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
        <div className="mb-2">
          <span className="font-mono text-sm text-primary/60 tracking-[0.3em] uppercase">PORTFOLIO DIVISION</span>
        </div>
        <h1 className="font-mono text-5xl md:text-6xl font-bold text-primary mb-2 text-glow tracking-tight">
          ANURAG'S SPACEPORT
        </h1>
        <p className="font-mono text-xs text-primary/50 tracking-widest uppercase mb-4">
          Deep Space Portfolio Navigation System v2.4.1
        </p>
        
        {/* Audio waveform visualization */}
        <div className="flex items-center justify-center gap-0.5 h-6 mb-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/40 rounded-sm"
              style={{
                height: `${30 + Math.sin(Date.now() / 100 + i) * 20}%`,
                animation: `pulse ${0.5 + i * 0.05}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* LEFT PANEL - SYSTEM CONFIG */}
      <div className="absolute left-4 top-20 w-80 pointer-events-auto">
        <div className="border border-primary/30 rounded-lg p-4 bg-background/40 backdrop-blur">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-sm text-primary uppercase tracking-widest font-bold">SYSTEM CONFIG</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "NAVIGATION", value: "ONLINE_" },
              { label: "LIFE SUPPORT", value: "NOMINAL_" },
              { label: "COMM ARRAY", value: "LINK EST._" },
              { label: "PROPULSION", value: "READY_" },
              { label: "MISSION", value: "PORTFOLIO_" },
              { label: "SHIELD GEN", value: "ACTIVE_" },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  sounds.play("click")
                  const planets = ["mercury", "venus", "earth", "mars", "jupiter", "saturn"]
                  if (i < planets.length) onSelectPlanet(planets[i])
                }}
                className="w-full text-left font-mono text-xs flex items-center justify-between hover:text-primary/80 transition-colors group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="text-primary/50 group-hover:text-primary/70">●</span>
                  <span className="text-muted-foreground group-hover:text-primary">{item.label}</span>
                </span>
                <span className="text-primary group-hover:text-primary/80">{item.value}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER-LEFT PANEL - PROXIMITY RADAR */}
      <div className="absolute left-4 bottom-32 w-80 pointer-events-auto">
        <div className="border border-primary/30 rounded-lg p-4 bg-background/40 backdrop-blur">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-sm text-primary uppercase tracking-widest font-bold">PROXIMITY RADAR</span>
          </div>
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="w-48 h-48">
              {/* Radar circles */}
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(0,200,220,0.1)" strokeWidth="0.5" />
              <circle cx="60" cy="60" r="35" fill="none" stroke="rgba(0,200,220,0.08)" strokeWidth="0.5" />
              <circle cx="60" cy="60" r="20" fill="none" stroke="rgba(0,200,220,0.06)" strokeWidth="0.5" />
              
              {/* Center dot */}
              <circle cx="60" cy="60" r="2" fill="rgba(0,200,220,0.8)" />
              
              {/* Planet blips */}
              {PLANETS.slice(0, 4).map((p, i) => {
                const angle = (i * 90) * Math.PI / 180
                const r = 30
                return (
                  <circle
                    key={p.id}
                    cx={60 + r * Math.cos(angle)}
                    cy={60 + r * Math.sin(angle)}
                    r="2.5"
                    fill={selectedPlanet === p.id ? p.color : "rgba(0,200,220,0.5)"}
                    opacity={selectedPlanet === p.id ? 1 : 0.7}
                  />
                )
              })}
              
              {/* Radar sweep */}
              <line x1="60" y1="60" x2="60" y2="15" stroke="rgba(0,200,220,0.3)" strokeWidth="0.5" style={{ animation: "rotate 3s linear infinite" }} />
            </svg>
          </div>
        </div>
      </div>

      {/* CENTER-RIGHT PANEL - SYSTEM DIAGNOSTICS */}
      <div className="absolute right-4 top-20 w-96 pointer-events-auto">
        <div className="border border-primary/30 rounded-lg p-4 bg-background/40 backdrop-blur">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-sm text-primary uppercase tracking-widest font-bold">SYSTEM DIAGNOSTICS</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "POWER", value: 98 },
              { label: "FUEL", value: 87 },
              { label: "O2", value: 100 },
              { label: "CPU", value: 42 },
              { label: "HULL", value: 100 },
              { label: "TEMP", value: 36 },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 relative flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,200,220,0.15)" strokeWidth="2" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#00ddff" 
                      strokeWidth="2"
                      strokeDasharray={`${(item.value / 100) * 282} 282`}
                      strokeDashoffset="0"
                      style={{ transition: "stroke-dasharray 0.5s ease" }}
                    />
                  </svg>
                  <span className="absolute font-mono text-sm font-bold text-primary">{item.value}%</span>
                </div>
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - TELEMETRY FEED */}
      <div className="absolute right-4 bottom-32 w-96 max-h-64 pointer-events-auto flex flex-col">
        <div className="border border-primary/30 rounded-lg p-4 bg-background/40 backdrop-blur flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-sm text-primary uppercase tracking-widest font-bold">TELEMETRY FEED</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 mb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            {scrollLog.map((log, i) => (
              <div key={i} className="font-mono text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                {log}
              </div>
            ))}
          </div>
        </div>
        
        {/* MISSION BRIEF */}
        <div className="border border-primary/30 rounded-lg p-4 bg-background/40 backdrop-blur mt-3 pointer-events-auto">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-primary/20">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-sm text-accent uppercase tracking-widest font-bold">MISSION BRIEF</span>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted-foreground/80">OBJECTIVE: Navigate the stellar portfolio</p>
            <p className="font-mono text-xs text-muted-foreground/80">SECTORS: Skills / Projects / Experience</p>
            <p className="font-mono text-xs text-muted-foreground/80">THREAT LEVEL: Minimal</p>
            <p className="font-mono text-xs text-muted-foreground/80">EST. DURATION: 5-10 min</p>
            <p className="font-mono text-xs text-muted-foreground/80">BLACK HOLE: Approach with caution</p>
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER - ORBIT STATUS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="border border-primary/30 rounded-lg px-6 py-3 bg-background/40 backdrop-blur flex items-center gap-6">
          <div className="text-center">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Apoapsis</span>
            <p className="font-mono text-sm text-primary font-bold">{altitude.toFixed(1)} km</p>
          </div>
          <span className="text-primary/20">|</span>
          <div className="text-center">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Periapsis</span>
            <p className="font-mono text-sm text-primary font-bold">{(altitude - 50).toFixed(1)} km</p>
          </div>
          <span className="text-primary/20">|</span>
          <div className="text-center">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Inclination</span>
            <p className="font-mono text-sm text-primary font-bold">51.6 deg</p>
          </div>
          <span className="text-primary/20">|</span>
          <div className="text-center">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Period</span>
            <p className="font-mono text-sm text-primary font-bold">{(missionTime / 60).toFixed(1)} min</p>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 border-t border-primary/20 bg-background/20 backdrop-blur-sm pointer-events-auto font-mono text-xs text-muted-foreground/50">
        <div className="flex items-center gap-4">
          <span>LAT {coords.lat}</span>
          <span>LON {coords.lon}</span>
          <span>ALT {altitude.toFixed(1)}km</span>
        </div>
        <div className="flex items-center gap-4">
          <span>VEL {velocity.toFixed(2)}</span>
          <span>ORBIT LEO</span>
          <span>SIGNAL {signalStrength.toFixed(0)}%</span>
        </div>
      </div>

      {/* Help guide */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={toggleHelp}
          />
          <div className="relative border border-primary/30 rounded-lg w-[calc(100vw-32px)] max-w-2xl max-h-[80vh] overflow-y-auto p-6 bg-background/40 backdrop-blur">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-primary/20">
              <span className="font-mono text-lg text-primary uppercase tracking-widest font-bold text-glow">MISSION CONTROL MANUAL</span>
              <button onClick={toggleHelp} className="font-mono text-primary hover:text-primary/70 cursor-pointer">[X]</button>
            </div>
            <div className="space-y-2 font-mono text-xs leading-relaxed">
              <p className="text-primary font-bold">NAVIGATION CONTROLS:</p>
              <p className="text-muted-foreground">• Drag to orbit • Scroll to zoom • Click planets to inspect</p>
              <p className="text-primary font-bold mt-3">HIDDEN EASTER EGGS:</p>
              <p className="text-muted-foreground">• Black hole has secrets • Wait for meteor shower • Deep space signal incoming</p>
            </div>
          </div>
        </div>
      )}

      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-primary/30" />
      <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-primary/30" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-primary/30" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-primary/30" />
    </div>
  )
}
