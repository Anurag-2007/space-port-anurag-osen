"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { PLANETS } from "./planet-data"
import { useSounds } from "./sound-engine"

interface SearchPanelProps {
  onSelectPlanet: (id: string) => void
  selectedPlanet: string | null
}

export function SearchPanel({ onSelectPlanet, selectedPlanet }: SearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filtered, setFiltered] = useState(PLANETS)
  const inputRef = useRef<HTMLInputElement>(null)
  const sounds = useSounds()

  // Open search on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    const query = searchQuery.toLowerCase()
    const results = PLANETS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
    )
    setFiltered(results)
  }, [searchQuery])

  const handleSelectPlanet = useCallback(
    (id: string) => {
      sounds.play("planet-select")
      onSelectPlanet(id)
      setIsOpen(false)
      setSearchQuery("")
    },
    [onSelectPlanet, sounds]
  )

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-30 glass-panel rounded-lg px-4 py-2 flex items-center gap-2 hover:border-primary/40 transition-colors cursor-pointer pointer-events-auto"
        aria-label="Open search"
      >
        <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
          {"SEARCH"} <span className="text-primary/60">Cmd+K</span>
        </span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Search panel */}
      <div className="relative glass-panel-bright rounded-lg w-[calc(100%-2rem)] max-w-2xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <span className="font-mono text-sm text-primary">/</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search planets, skills, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-sm text-foreground placeholder-muted-foreground/50"
            autoFocus
          />
          <span className="font-mono text-[10px] text-muted-foreground/50 tracking-widest">ESC</span>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filtered.length > 0 ? (
            <div className="divide-y divide-border/20">
              {filtered.map((planet) => (
                <button
                  key={planet.id}
                  onClick={() => handleSelectPlanet(planet.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors font-mono text-sm flex items-center gap-3 ${
                    selectedPlanet === planet.id ? "bg-primary/10 border-l-2 border-primary" : ""
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: planet.color }}
                  />
                  <div className="flex-1">
                    <div className="text-foreground font-semibold">{planet.name.toUpperCase()}</div>
                    <div className="text-[10px] text-muted-foreground/60">{planet.description}</div>
                  </div>
                  {selectedPlanet === planet.id && (
                    <span className="text-primary text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-sm text-muted-foreground/60">
                No planets found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/20 px-4 py-2 bg-background/30">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 font-mono">
            <div className="flex gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
            </div>
            <span>{filtered.length} results</span>
          </div>
        </div>
      </div>
    </div>
  )
}
