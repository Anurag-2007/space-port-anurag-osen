"use client"

import { useEffect, useState, useRef } from "react"

interface DynamicTelemetryProps {
  visible: boolean
}

export function DynamicTelemetry({ visible }: DynamicTelemetryProps) {
  const [waveform, setWaveform] = useState<number[]>(Array(32).fill(0))
  const [radarAngle, setRadarAngle] = useState(0)
  const [pulseIntensity, setPulseIntensity] = useState(0.5)
  const [systemHealth, setSystemHealth] = useState(98)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  // Initialize audio reactivity
  useEffect(() => {
    if (!visible) return

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256

      audioContextRef.current = audioCtx
      analyserRef.current = analyser

      // Try to connect to system audio output for reactivity
      // This requires user permission in modern browsers
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const source = audioCtx.createMediaStreamAudioSource(stream)
          source.connect(analyser)
          analyser.connect(audioCtx.destination)
        })
        .catch(() => {
          // Silently fail if microphone not available
        })
    } catch {
      // AudioContext not supported
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [visible])

  // Animate waveform and radar
  useEffect(() => {
    if (!visible) return

    const interval = setInterval(() => {
      setRadarAngle((a) => (a + 3) % 360)
      
      // Simulate waveform
      setWaveform(
        Array(32)
          .fill(0)
          .map(() => Math.random() * 0.8 + Math.sin(Date.now() * 0.001) * 0.2)
      )

      // Pulsing system health
      setPulseIntensity(0.4 + Math.sin(Date.now() * 0.003) * 0.3)
      setSystemHealth(95 + Math.random() * 5)
    }, 50)

    return () => clearInterval(interval)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed right-6 bottom-24 z-20 flex flex-col gap-3 pointer-events-none">
      {/* Radar display */}
      <div className="glass-panel rounded-lg p-3 w-28 h-28">
        <div className="relative w-full h-full">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Radar rings */}
            <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(0,200,220,0.15)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(0,200,220,0.1)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(0,200,220,0.1)" strokeWidth="0.5" />

            {/* Crosshairs */}
            <line x1="50" y1="15" x2="50" y2="85" stroke="rgba(0,200,220,0.08)" strokeWidth="0.5" />
            <line x1="15" y1="50" x2="85" y2="50" stroke="rgba(0,200,220,0.08)" strokeWidth="0.5" />

            {/* Rotating sweep */}
            <line
              x1="50"
              y1="50"
              x2={50 + Math.cos((radarAngle * Math.PI) / 180 - Math.PI / 2) * 35}
              y2={50 + Math.sin((radarAngle * Math.PI) / 180 - Math.PI / 2) * 35}
              stroke="rgba(0,200,220,0.6)"
              strokeWidth="1"
            />

            {/* Sweep fill */}
            <path
              d={`M50,50 L${50 + Math.cos(((radarAngle - 20) * Math.PI) / 180 - Math.PI / 2) * 35},${50 + Math.sin(((radarAngle - 20) * Math.PI) / 180 - Math.PI / 2) * 35} A35,35 0 0,1 ${50 + Math.cos((radarAngle * Math.PI) / 180 - Math.PI / 2) * 35},${50 + Math.sin((radarAngle * Math.PI) / 180 - Math.PI / 2) * 35} Z`}
              fill="rgba(0,200,220,0.05)"
            />

            {/* Blips */}
            <circle cx="65" cy="35" r="1.5" fill="rgba(0,255,136,0.7)" className="animate-pulse" />
            <circle cx="38" cy="62" r="1" fill="rgba(255,102,0,0.7)" className="animate-pulse" />
            <circle cx="72" cy="58" r="1.2" fill="rgba(0,200,220,0.7)" className="animate-pulse" />
          </svg>
        </div>
        <div className="text-center mt-1">
          <span className="font-mono text-[7px] text-muted-foreground/40 uppercase tracking-wider">
            RADAR
          </span>
        </div>
      </div>

      {/* System health indicator */}
      <div className="glass-panel rounded-lg p-2 w-28">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[7px] text-primary uppercase tracking-widest">SYS</span>
          <span className="font-mono text-[8px] text-foreground/70">{systemHealth.toFixed(0)}%</span>
        </div>
        <div className="relative h-1.5 bg-background/50 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-300 rounded-full shadow-lg"
            style={{
              width: `${systemHealth}%`,
              opacity: pulseIntensity,
              boxShadow: `0 0 8px rgba(0, 200, 220, ${pulseIntensity})`,
            }}
          />
        </div>
      </div>

      {/* Waveform analyzer */}
      <div className="glass-panel rounded-lg p-2 w-28 h-16">
        <div className="flex items-end justify-between gap-0.5 h-12">
          {waveform.slice(0, 12).map((v, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t-sm transition-all duration-75"
              style={{
                height: `${Math.max(10, v * 100)}%`,
                opacity: 0.6 + v * 0.4,
              }}
            />
          ))}
        </div>
        <div className="text-center mt-1">
          <span className="font-mono text-[7px] text-muted-foreground/40 uppercase tracking-wider">
            Signal
          </span>
        </div>
      </div>
    </div>
  )
}
