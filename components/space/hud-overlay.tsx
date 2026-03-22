"use client"

import { useState, useEffect, useRef } from "react"
import { PLANETS } from "./planet-data"
import { useSounds } from "./sound-engine"

interface HudOverlayProps {
  visible: boolean
  selectedPlanet: string | null
  onSelectPlanet: (id: string | null) => void
}

export function HudOverlay({ visible, selectedPlanet, onSelectPlanet }: HudOverlayProps) {
  const [missionTime, setMissionTime] = useState(0)
  const [coordinates, setCoordinates] = useState({ x: 0.0, y: 0.0, z: 0.0 })
  const [velocity, setVelocity] = useState(0)
  const [altitude, setAltitude] = useState(0)
  const [signalStrength, setSignalStrength] = useState(85)
  const [fps, setFps] = useState(60)
  const [exploredCount, setExploredCount] = useState(0)
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "[13:18:29.223] SYS.CORE > Initializing quantum nav matrix...",
    "[13:18:30.028] NAV.GPS > Calculating orbital trajectory...",
    "[13:18:30.819] COM.LINK > Establishing deep-space relay...",
    "[13:18:31.624] PWR.MAIN > Fusion reactor output: 98.7%",
  ])

  const sounds = useSounds()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fpsRef = useRef(0)
  const lastFpsTime = useRef(Date.now())
  const exploredRef = useRef(new Set<string>())

  // Update telemetry
  useEffect(() => {
    if (!visible) return
    const timer = setInterval(() => {
      setMissionTime((t) => t + 1)
      const t = Date.now() / 1000
      setCoordinates({
        x: Math.sin(t * 0.5) * 50,
        y: Math.cos(t * 0.3) * 40,
        z: Math.sin(t * 0.7) * 60,
      })
      setVelocity(15 + Math.sin(t) * 8)
      setAltitude(120 + Math.cos(t * 0.5) * 30)
      setSignalStrength(75 + Math.random() * 25)
    }, 500)
    return () => clearInterval(timer)
  }, [visible])

  // FPS counter
  useEffect(() => {
    const countFrame = () => {
      fpsRef.current++
      const now = Date.now()
      if (now - lastFpsTime.current >= 1000) {
        setFps(fpsRef.current)
        fpsRef.current = 0
        lastFpsTime.current = now
      }
      requestAnimationFrame(countFrame)
    }
    const id = requestAnimationFrame(countFrame)
    return () => cancelAnimationFrame(id)
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [systemLogs])

  // Handle planet selection
  const handleSelectPlanet = (id: string) => {
    if (!exploredRef.current.has(id)) {
      exploredRef.current.add(id)
      setExploredCount(exploredRef.current.size)
      setSystemLogs((prev) => [
        ...prev.slice(-3),
        `[${new Date().toLocaleTimeString()}] NAV.TARGET > Lock acquired on ${id.toUpperCase()}`,
      ])
    }
    onSelectPlanet(id === selectedPlanet ? null : id)
    sounds.play("click")
  }

  if (!visible) return null

  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(
      Math.floor((seconds % 3600) / 60)
    ).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

  return (
    <div className="fixed inset-0 z-30 pointer-events-none font-mono">
      {/* TOP STATUS BAR */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b border-cyan-500/30 bg-gradient-to-b from-background/70 to-transparent backdrop-blur-sm flex items-center justify-between px-6 pointer-events-auto text-xs text-cyan-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="uppercase tracking-widest">SYS.ONLINE</span>
          </div>
          <div>CORE TEMP: 36.4C</div>
          <div>SIGNAL: {signalStrength.toFixed(1)}%</div>
        </div>
        <div className="text-center text-cyan-400/60">
          {new Date().toLocaleTimeString("en-GB")}
        </div>
        <div className="flex items-center gap-6 text-cyan-400/60">
          <div>MEM: 2.4TB/4TB</div>
          <div className="flex items-center gap-2">
            <span>SEC.LVL:</span>
            <span className="text-green-500">ALPHA_</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="absolute top-12 bottom-12 inset-x-0 flex">
        {/* LEFT PANEL - NAVIGATION */}
        <div className="w-96 border-r border-cyan-500/20 bg-background/30 backdrop-blur p-6 overflow-y-auto pointer-events-auto">
          <div className="text-xs text-cyan-400/60 uppercase tracking-widest mb-4 font-bold">
            ● SYSTEM CONFIG
          </div>
          <div className="space-y-2 mb-6 text-xs text-cyan-400/70">
            <div className="flex justify-between">
              <span>● NAVIGATION</span>
              <span className="text-cyan-400">ONLINE_</span>
            </div>
            <div className="flex justify-between">
              <span>● LIFE SUPPORT</span>
              <span className="text-cyan-400">NOMINAL_</span>
            </div>
            <div className="flex justify-between">
              <span>● COMM ARRAY</span>
              <span className="text-cyan-400">LINK EST._</span>
            </div>
            <div className="flex justify-between">
              <span>● PROPULSION</span>
              <span className="text-cyan-400">READY_</span>
            </div>
            <div className="flex justify-between">
              <span>● MISSION</span>
              <span className="text-orange-400">PORTFOLIO_</span>
            </div>
            <div className="flex justify-between">
              <span>● SHIELD GEN</span>
              <span className="text-cyan-400">ACTIVE_</span>
            </div>
            <div className="flex justify-between">
              <span>● WEAPONS</span>
              <span className="text-orange-400">STANDBY_</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="border-t border-cyan-500/20 pt-4">
            <div className="text-xs text-cyan-400/60 uppercase tracking-widest mb-3 font-bold">
              ● PRIMARY NAVIGATION
            </div>
            <div className="space-y-2">
              {PLANETS.map((planet) => (
                <button
                  key={planet.id}
                  onClick={() => handleSelectPlanet(planet.id)}
                  className={`w-full text-left px-3 py-2 rounded text-xs uppercase tracking-wider transition-all ${
                    selectedPlanet === planet.id
                      ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300"
                      : "border border-cyan-500/30 text-cyan-400/70 hover:border-cyan-400 hover:text-cyan-400"
                  }`}
                >
                  ● {planet.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER CONTENT */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="text-center space-y-4 mb-12">
            <div className="text-xs text-cyan-400/50 uppercase tracking-[0.3em]">
              ◆ PORTFOLIO DIVISION ◆
            </div>
            <h1
              className="text-6xl font-bold tracking-wider text-cyan-300"
              style={{
                textShadow: "0 0 30px rgba(0, 200, 220, 0.6), 0 0 60px rgba(0, 200, 220, 0.3)",
              }}
            >
              ANURAG'S SPACEPORT
            </h1>
            <div className="text-xs text-cyan-400/40 uppercase tracking-[0.2em]">
              Deep Space Portfolio Navigation System v2.4.1
            </div>

            {/* Animated Waveform */}
            <div className="flex items-center justify-center gap-0.5 mt-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-t from-cyan-400 to-cyan-300 rounded-sm"
                  style={{
                    width: "3px",
                    height: `${10 + Math.sin(Date.now() / 100 + i * 0.3) * 10}px`,
                    transition: "height 50ms ease-out",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Panel Grid */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-4xl">
            {/* Panel 1: Proximity Radar */}
            <div className="border border-cyan-500/30 bg-cyan-500/5 rounded p-4">
              <div className="text-xs text-cyan-400 uppercase tracking-widest mb-3 font-bold">
                ● PROXIMITY RADAR
              </div>
              <svg viewBox="0 0 100 100" className="w-full h-32 mb-2">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,200,220,0.1)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(0,200,220,0.15)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,200,220,0.2)" strokeWidth="1" />
                <circle cx="50" cy="50" r="2" fill="#00c8dc" />
                {PLANETS.slice(0, 5).map((p, i) => {
                  const angle = (i / 5) * Math.PI * 2
                  const x = 50 + Math.cos(angle - Math.PI / 2) * 30
                  const y = 50 + Math.sin(angle - Math.PI / 2) * 30
                  return (
                    <circle
                      key={p.id}
                      cx={x}
                      cy={y}
                      r="2"
                      fill={selectedPlanet === p.id ? p.color : "rgba(0,200,220,0.4)"}
                    />
                  )
                })}
              </svg>
              <div className="text-[10px] text-cyan-400/60 text-center">ORBIT STATUS</div>
            </div>

            {/* Panel 2: System Diagnostics */}
            <div className="border border-cyan-500/30 bg-cyan-500/5 rounded p-4">
              <div className="text-xs text-cyan-400 uppercase tracking-widest mb-3 font-bold">
                ● SYSTEM DIAGNOSTICS
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-cyan-400/70">
                <div className="flex flex-col items-center p-2 border border-cyan-500/20 rounded">
                  <div className="text-cyan-400/50 mb-1">POWER</div>
                  <div className="text-lg text-cyan-400">98%</div>
                </div>
                <div className="flex flex-col items-center p-2 border border-cyan-500/20 rounded">
                  <div className="text-cyan-400/50 mb-1">FUEL</div>
                  <div className="text-lg text-cyan-400">87%</div>
                </div>
                <div className="flex flex-col items-center p-2 border border-cyan-500/20 rounded">
                  <div className="text-cyan-400/50 mb-1">O2</div>
                  <div className="text-lg text-cyan-400">100%</div>
                </div>
                <div className="flex flex-col items-center p-2 border border-cyan-500/20 rounded">
                  <div className="text-cyan-400/50 mb-1">CPU</div>
                  <div className="text-lg text-cyan-400">42%</div>
                </div>
                <div className="flex flex-col items-center p-2 border border-cyan-500/20 rounded">
                  <div className="text-cyan-400/50 mb-1">HULL</div>
                  <div className="text-lg text-cyan-400">100%</div>
                </div>
                <div className="flex flex-col items-center p-2 border border-cyan-500/20 rounded">
                  <div className="text-cyan-400/50 mb-1">TEMP</div>
                  <div className="text-lg text-cyan-400">36C</div>
                </div>
              </div>
            </div>

            {/* Panel 3: Orbit Status & Launch */}
            <div className="border border-cyan-500/30 bg-cyan-500/5 rounded p-4 flex flex-col">
              <div className="text-xs text-cyan-400 uppercase tracking-widest mb-3 font-bold">
                ● ORBIT STATUS
              </div>
              <div className="text-xs text-cyan-400/70 space-y-1 mb-4 flex-1">
                <div className="flex justify-between">
                  <span>Apoapsis</span>
                  <span>420.3 km</span>
                </div>
                <div className="flex justify-between">
                  <span>Periapsis</span>
                  <span>360.1 km</span>
                </div>
                <div className="flex justify-between">
                  <span>Inclination</span>
                  <span>51.6 deg</span>
                </div>
                <div className="flex justify-between">
                  <span>Period</span>
                  <span>92.4 min</span>
                </div>
              </div>
              <div className="border-t border-cyan-500/20 pt-2">
                <div className="text-[10px] text-cyan-400/60">ALL SYSTEMS NOMINAL</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - TELEMETRY */}
        <div className="w-96 border-l border-cyan-500/20 bg-background/30 backdrop-blur p-6 flex flex-col pointer-events-auto">
          <div className="text-xs text-cyan-400/60 uppercase tracking-widest mb-4 font-bold">
            ● TELEMETRY FEED
          </div>

          <div
            ref={scrollRef}
            className="flex-1 border border-cyan-500/20 rounded bg-cyan-500/5 p-3 text-[9px] text-orange-400/60 overflow-y-auto mb-4 font-mono"
          >
            <div className="space-y-1">
              {systemLogs.map((log, i) => (
                <div key={i} className="hover:text-orange-400/100 transition-colors">
                  {log}
                </div>
              ))}
              {systemLogs.length < 5 && (
                <div className="text-cyan-400/40 animate-pulse">{">"}</div>
              )}
            </div>
          </div>

          <div className="text-xs text-cyan-400/60 uppercase tracking-widest mb-2 font-bold">
            ● MISSION BRIEF
          </div>
          <div className="border border-cyan-500/20 rounded bg-cyan-500/5 p-3 text-xs text-cyan-400/70 mb-4">
            <p className="mb-2">OBJECTIVE: Navigate the stellar portfolio</p>
            <p className="mb-2">SECTORS: Skills / Projects / Experience</p>
            <p>THREAT LEVEL: Minimal</p>
          </div>

          <div className="text-xs text-cyan-400/60 uppercase tracking-widest mb-2 font-bold">
            ● EXPLORATION
          </div>
          <div className="border border-cyan-500/20 rounded bg-cyan-500/5 p-2 mb-4">
            <div className="flex justify-between items-center text-xs text-cyan-400/70 mb-2">
              <span>{exploredCount}/8 Sectors</span>
              <span>{Math.round((exploredCount / 8) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-cyan-500/10 rounded overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${(exploredCount / 8) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-cyan-400/50 text-center">
            {formatTime(missionTime)}
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROL BAR */}
      <div className="absolute bottom-0 left-0 right-0 h-12 border-t border-cyan-500/30 bg-gradient-to-t from-background/70 to-transparent backdrop-blur-sm flex items-center justify-between px-6 pointer-events-auto text-xs text-cyan-400/60">
        <div className="flex items-center gap-4">
          <span className="text-cyan-400">ALL SYSTEMS NOMINAL</span>
        </div>
        <div className="flex items-center gap-4">
          <span>DRAG: Orbit | SCROLL: Zoom | 1-7: Jump</span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            LAT: {coordinates.x.toFixed(2)} LON: {coordinates.y.toFixed(2)} ALT:{" "}
            {altitude.toFixed(1)}km
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>VEL: {velocity.toFixed(2)}</span>
          <span>ORBIT: LEO</span>
          <span>SIGNAL: {signalStrength.toFixed(1)}</span>
        </div>
      </div>
    </div>
  )
}
