"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { StartScreen } from "@/components/space/start-screen"
import { SpaceScene } from "@/components/space/space-scene"
import { HudOverlay } from "@/components/space/hud-overlay"
import { InfoPanel } from "@/components/space/info-panel"
import { SoundProvider, useSounds } from "@/components/space/sound-engine"

function SpacePortfolioInner() {
  const [phase, setPhase] = useState<"start" | "launching" | "space">("start")
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)
  const [showStart, setShowStart] = useState(true)
  const sounds = useSounds()
  const hasInitSound = useRef(false)

  // Easter egg states
  const [deepSpaceSignal, setDeepSpaceSignal] = useState(false)
  const [signalDismissed, setSignalDismissed] = useState(false)
  const [tripleClickMsg, setTripleClickMsg] = useState(false)
  const [idleMeteorMsg, setIdleMeteorMsg] = useState(false)
  const lastInteraction = useRef(Date.now())
  const tripleClickCount = useRef(0)
  const tripleClickTimer = useRef<ReturnType<typeof setTimeout>>()

  // Initialize sound on first interaction
  useEffect(() => {
    const initOnInteraction = () => {
      if (!hasInitSound.current) {
        sounds.init()
        hasInitSound.current = true
      }
    }
    window.addEventListener("click", initOnInteraction, { once: true })
    window.addEventListener("keydown", initOnInteraction, { once: true })
    return () => {
      window.removeEventListener("click", initOnInteraction)
      window.removeEventListener("keydown", initOnInteraction)
    }
  }, [sounds])

  // Deep space signal easter egg: after 70-120s of exploration
  useEffect(() => {
    if (phase !== "space" || signalDismissed) return
    const delay = 30000 + Math.random() * 50000
    const timer = setTimeout(() => {
      setDeepSpaceSignal(true)
      sounds.play("scan")
    }, delay)
    return () => clearTimeout(timer)
  }, [phase, signalDismissed, sounds])

  // Triple-click background easter egg
  useEffect(() => {
    if (phase !== "space") return
    const handleClick = (e: MouseEvent) => {
      lastInteraction.current = Date.now()
      // Only count clicks on the background (not on UI elements)
      const target = e.target as HTMLElement
      if (target.tagName === "CANVAS") {
        tripleClickCount.current++
        if (tripleClickTimer.current) clearTimeout(tripleClickTimer.current)
        tripleClickTimer.current = setTimeout(() => {
          tripleClickCount.current = 0
        }, 500)
        if (tripleClickCount.current >= 3) {
          tripleClickCount.current = 0
          setTripleClickMsg(true)
          sounds.play("scan")
          setTimeout(() => setTripleClickMsg(false), 6000)
        }
      }
    }
    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
  }, [phase, sounds])

  // Idle meteor shower easter egg: after 20s idle
  useEffect(() => {
    if (phase !== "space") return
    const trackActivity = () => {
      lastInteraction.current = Date.now()
      setIdleMeteorMsg(false)
    }
    window.addEventListener("mousemove", trackActivity)
    window.addEventListener("keydown", trackActivity)
    window.addEventListener("touchstart", trackActivity)

    const interval = setInterval(() => {
      if (Date.now() - lastInteraction.current > 20000 && !idleMeteorMsg) {
        setIdleMeteorMsg(true)
        sounds.play("shooting-star")
      }
    }, 5000)

    return () => {
      window.removeEventListener("mousemove", trackActivity)
      window.removeEventListener("keydown", trackActivity)
      window.removeEventListener("touchstart", trackActivity)
      clearInterval(interval)
    }
  }, [phase, idleMeteorMsg, sounds])

  const handleLaunch = useCallback(() => {
    setPhase("launching")
    setTimeout(() => {
      setPhase("space")
      setShowStart(false)
      sounds.play("warp")
    }, 2600)
  }, [sounds])

  const handleSelectPlanet = useCallback(
    (id: string | null) => {
      if (id && id !== selectedPlanet) {
        sounds.play("planet-select")
      }
      setSelectedPlanet(id)
    },
    [selectedPlanet, sounds]
  )

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPlanet(null)
        setDeepSpaceSignal(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      {/* 3D Scene */}
      <SpaceScene
        launched={phase === "space"}
        selectedPlanet={selectedPlanet}
        onSelectPlanet={handleSelectPlanet}
        idleMeteorShower={idleMeteorMsg}
      />

      {/* HUD Overlay */}
      <HudOverlay
        visible={phase === "space"}
        selectedPlanet={selectedPlanet}
        onSelectPlanet={handleSelectPlanet}
      />

      {/* Info Panel for selected planet */}
      {selectedPlanet && phase === "space" && (
        <InfoPanel
          planetId={selectedPlanet}
          onClose={() => setSelectedPlanet(null)}
        />
      )}

      {/* Deep Space Signal Easter Egg */}
      {deepSpaceSignal && !signalDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto animate-in fade-in duration-1000">
          <div
            className="absolute inset-0 bg-background/40 backdrop-blur-sm"
            onClick={() => {
              setSignalDismissed(true)
              setDeepSpaceSignal(false)
            }}
          />
          <div className="relative glass-panel-bright rounded-lg max-w-md w-[calc(100%-32px)] p-6 text-center space-y-4">
            {/* Radio distortion lines */}
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-primary/60 rounded-full transition-all"
                  style={{
                    height: `${8 + Math.random() * 16}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-xs text-accent uppercase tracking-[0.3em] font-bold">
                Weak Signal Detected
              </span>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <p className="font-mono text-sm text-foreground/80 leading-relaxed">
              {"\"To whoever finds this signal in the void \u2014"}
            </p>
            <p className="font-mono text-sm text-foreground/60 leading-relaxed">
              {"Thank you for navigating through my universe, orbiting my ideas, and docking at my creations. Until our trajectories cross again —safe travels through the cosmos.\""}
            </p>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-widest">
              Signal origin: Unknown // Frequency: 1420.405 MHz
            </p>
            <button
              onClick={() => {
                setSignalDismissed(true)
                setDeepSpaceSignal(false)
                sounds.play("click")
              }}
              className="font-mono text-xs text-primary hover:text-foreground transition-colors cursor-pointer glass-panel rounded px-4 py-2"
            >
              {"[ACKNOWLEDGE SIGNAL]"}
            </button>
          </div>
        </div>
      )}

      {/* Triple-Click Easter Egg */}
      {tripleClickMsg && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none animate-in fade-in duration-700">
          <p className="font-mono text-sm text-foreground/30 text-center whitespace-nowrap text-glow">
            This universe was built with curiosity, obsession, and caffeine.
          </p>
        </div>
      )}

      {/* Idle Meteor Shower hint */}
      {idleMeteorMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="glass-panel rounded-lg px-4 py-2">
            <span className="font-mono text-[10px] text-primary/60 uppercase tracking-widest">
              Meteor shower incoming... watch the sky
            </span>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {showStart && <StartScreen onLaunch={handleLaunch} />}
    </main>
  )
}

export default function SpacePortfolio() {
  return (
    <SoundProvider>
      <SpacePortfolioInner />
    </SoundProvider>
  )
}
