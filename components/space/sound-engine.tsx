"use client"

import { createContext, useContext, useRef, useCallback, useEffect, useState } from "react"

interface SoundEngine {
  play: (name: SoundName, options?: PlayOptions) => void
  playLoop: (name: SoundName, volume?: number) => () => void
  setMasterVolume: (v: number) => void
  isMuted: boolean
  toggleMute: () => void
  isReady: boolean
  init: () => void
}

interface PlayOptions {
  volume?: number
  rate?: number
  detune?: number
}

type SoundName =
  | "click"
  | "hover"
  | "launch"
  | "countdown"
  | "ignition"
  | "whoosh"
  | "planet-hover"
  | "planet-select"
  | "blackhole-hum"
  | "asteroid-pass"
  | "shooting-star"
  | "nebula-burst"
  | "warp"
  | "alarm"
  | "beep"
  | "deep-space"
  | "engine-rumble"
  | "scan"
  | "radio-static"
  | "satellite-beep"
  | "supernova"

const SoundContext = createContext<SoundEngine | null>(null)

export function useSounds() {
  const ctx = useContext(SoundContext)
  if (!ctx) throw new Error("useSounds must be used within SoundProvider")
  return ctx
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const mutedRef = useRef(false)

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
      masterGainRef.current = audioCtxRef.current.createGain()
      masterGainRef.current.connect(audioCtxRef.current.destination)
      masterGainRef.current.gain.value = 0.5
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return { ctx: audioCtxRef.current, master: masterGainRef.current! }
  }, [])

  const init = useCallback(() => {
    getCtx()
    setIsReady(true)
  }, [getCtx])

  // Synth sounds using Web Audio API
  const createSound = useCallback(
    (name: SoundName, options: PlayOptions = {}) => {
      if (mutedRef.current) return
      const { ctx, master } = getCtx()
      const vol = options.volume ?? 0.3
      const now = ctx.currentTime

      const gain = ctx.createGain()
      gain.connect(master)
      gain.gain.value = 0

      switch (name) {
        case "click": {
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.value = 800
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.4, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
          osc.start(now)
          osc.stop(now + 0.08)
          break
        }
        case "hover": {
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.value = 1200
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.15, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
          osc.start(now)
          osc.stop(now + 0.05)
          break
        }
        case "beep": {
          const osc = ctx.createOscillator()
          osc.type = "square"
          osc.frequency.setValueAtTime(880, now)
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.15)
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.2, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
          osc.start(now)
          osc.stop(now + 0.15)
          break
        }
        case "countdown": {
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.value = 660
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.6, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
          osc.start(now)
          osc.stop(now + 0.4)
          // Second beep
          const osc2 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc2.type = "sine"
          osc2.frequency.value = 880
          osc2.connect(gain2)
          gain2.connect(master)
          gain2.gain.setValueAtTime(vol * 0.3, now + 0.15)
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
          osc2.start(now + 0.15)
          osc2.stop(now + 0.35)
          break
        }
        case "ignition": {
          // Rumble + rising tone
          const noise = createNoise(ctx, 2)
          const filter = ctx.createBiquadFilter()
          filter.type = "lowpass"
          filter.frequency.setValueAtTime(100, now)
          filter.frequency.exponentialRampToValueAtTime(3000, now + 1.5)
          noise.connect(filter)
          filter.connect(gain)
          gain.gain.setValueAtTime(vol * 0.8, now)
          gain.gain.linearRampToValueAtTime(vol, now + 0.5)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2)
          noise.start(now)
          noise.stop(now + 2)
          // Rising tone
          const osc = ctx.createOscillator()
          osc.type = "sawtooth"
          osc.frequency.setValueAtTime(40, now)
          osc.frequency.exponentialRampToValueAtTime(200, now + 1.5)
          const oscGain = ctx.createGain()
          osc.connect(oscGain)
          oscGain.connect(master)
          oscGain.gain.setValueAtTime(vol * 0.4, now)
          oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2)
          osc.start(now)
          osc.stop(now + 2)
          break
        }
        case "launch": {
          // Massive rumble + whoosh
          const noise = createNoise(ctx, 3)
          const filter = ctx.createBiquadFilter()
          filter.type = "lowpass"
          filter.frequency.setValueAtTime(200, now)
          filter.frequency.exponentialRampToValueAtTime(8000, now + 2)
          noise.connect(filter)
          filter.connect(gain)
          gain.gain.setValueAtTime(vol, now)
          gain.gain.linearRampToValueAtTime(vol * 0.8, now + 1)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3)
          noise.start(now)
          noise.stop(now + 3)
          // Sub bass
          const sub = ctx.createOscillator()
          sub.type = "sine"
          sub.frequency.value = 30
          const subGain = ctx.createGain()
          sub.connect(subGain)
          subGain.connect(master)
          subGain.gain.setValueAtTime(vol * 0.5, now)
          subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5)
          sub.start(now)
          sub.stop(now + 2.5)
          break
        }
        case "whoosh": {
          const noise = createNoise(ctx, 0.5)
          const filter = ctx.createBiquadFilter()
          filter.type = "bandpass"
          filter.frequency.setValueAtTime(500, now)
          filter.frequency.exponentialRampToValueAtTime(4000, now + 0.2)
          filter.frequency.exponentialRampToValueAtTime(200, now + 0.5)
          filter.Q.value = 2
          noise.connect(filter)
          filter.connect(gain)
          gain.gain.setValueAtTime(vol * 0.5, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
          noise.start(now)
          noise.stop(now + 0.5)
          break
        }
        case "planet-hover": {
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.value = 400 + (options.detune || 0)
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.2, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
          osc.start(now)
          osc.stop(now + 0.3)
          // Harmonic
          const osc2 = ctx.createOscillator()
          osc2.type = "sine"
          osc2.frequency.value = 600 + (options.detune || 0)
          const g2 = ctx.createGain()
          osc2.connect(g2)
          g2.connect(master)
          g2.gain.setValueAtTime(vol * 0.1, now + 0.05)
          g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
          osc2.start(now + 0.05)
          osc2.stop(now + 0.25)
          break
        }
        case "planet-select": {
          // Chord arpeggio
          const freqs = [440, 554, 659]
          freqs.forEach((f, i) => {
            const o = ctx.createOscillator()
            o.type = "sine"
            o.frequency.value = f
            const g = ctx.createGain()
            o.connect(g)
            g.connect(master)
            const t = now + i * 0.08
            g.gain.setValueAtTime(vol * 0.3, t)
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
            o.start(t)
            o.stop(t + 0.4)
          })
          break
        }
        case "asteroid-pass": {
          const osc = ctx.createOscillator()
          osc.type = "sawtooth"
          osc.frequency.setValueAtTime(150, now)
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.3)
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.15, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
          osc.start(now)
          osc.stop(now + 0.3)
          break
        }
        case "shooting-star": {
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.setValueAtTime(2000, now)
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.8)
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.2, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
          osc.start(now)
          osc.stop(now + 0.8)
          break
        }
        case "nebula-burst": {
          const noise = createNoise(ctx, 1.5)
          const filter = ctx.createBiquadFilter()
          filter.type = "bandpass"
          filter.frequency.value = 800
          filter.Q.value = 1
          noise.connect(filter)
          filter.connect(gain)
          gain.gain.setValueAtTime(vol * 0.5, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
          noise.start(now)
          noise.stop(now + 1.5)
          // Shimmer
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.setValueAtTime(1200, now)
          osc.frequency.exponentialRampToValueAtTime(600, now + 1)
          const sg = ctx.createGain()
          osc.connect(sg)
          sg.connect(master)
          sg.gain.setValueAtTime(vol * 0.2, now)
          sg.gain.exponentialRampToValueAtTime(0.001, now + 1)
          osc.start(now)
          osc.stop(now + 1)
          break
        }
        case "warp": {
          const osc = ctx.createOscillator()
          osc.type = "sawtooth"
          osc.frequency.setValueAtTime(100, now)
          osc.frequency.exponentialRampToValueAtTime(2000, now + 0.5)
          osc.frequency.exponentialRampToValueAtTime(50, now + 1.5)
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.4, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
          osc.start(now)
          osc.stop(now + 1.5)
          break
        }
        case "alarm": {
          const osc = ctx.createOscillator()
          osc.type = "square"
          osc.frequency.setValueAtTime(800, now)
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.15, now)
          // Pulsing
          for (let i = 0; i < 6; i++) {
            gain.gain.setValueAtTime(vol * 0.15, now + i * 0.15)
            gain.gain.setValueAtTime(0, now + i * 0.15 + 0.08)
          }
          gain.gain.setValueAtTime(0, now + 0.9)
          osc.start(now)
          osc.stop(now + 0.9)
          break
        }
        case "scan": {
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.setValueAtTime(300, now)
          osc.frequency.linearRampToValueAtTime(1500, now + 0.5)
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.15, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
          osc.start(now)
          osc.stop(now + 0.5)
          break
        }
        case "deep-space": {
          // Low drone
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.value = 60
          const lfo = ctx.createOscillator()
          lfo.type = "sine"
          lfo.frequency.value = 0.2
          const lfoGain = ctx.createGain()
          lfoGain.gain.value = 10
          lfo.connect(lfoGain)
          lfoGain.connect(osc.frequency)
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.15, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 4)
          osc.start(now)
          lfo.start(now)
          osc.stop(now + 4)
          lfo.stop(now + 4)
          break
        }
        case "engine-rumble": {
          const noise = createNoise(ctx, 2)
          const filter = ctx.createBiquadFilter()
          filter.type = "lowpass"
          filter.frequency.value = 150
          filter.Q.value = 5
          noise.connect(filter)
          filter.connect(gain)
          gain.gain.setValueAtTime(vol * 0.3, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2)
          noise.start(now)
          noise.stop(now + 2)
          break
        }
        case "blackhole-hum": {
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.value = 40
          const lfo = ctx.createOscillator()
          lfo.type = "sine"
          lfo.frequency.value = 0.5
          const lfoGain = ctx.createGain()
          lfoGain.gain.value = 8
          lfo.connect(lfoGain)
          lfoGain.connect(osc.frequency)
          osc.connect(gain)
          gain.gain.setValueAtTime(vol * 0.2, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3)
          osc.start(now)
          lfo.start(now)
          osc.stop(now + 3)
          lfo.stop(now + 3)
          // Eerie overtone
          const o2 = ctx.createOscillator()
          o2.type = "sine"
          o2.frequency.value = 120
          const g2 = ctx.createGain()
          o2.connect(g2)
          g2.connect(master)
          g2.gain.setValueAtTime(vol * 0.08, now)
          g2.gain.exponentialRampToValueAtTime(0.001, now + 3)
          o2.start(now)
          o2.stop(now + 3)
          break
        }
        case "radio-static": {
          // Short burst of filtered noise that sounds like radio static
          const noise = createNoise(ctx, 0.8)
          const filter = ctx.createBiquadFilter()
          filter.type = "bandpass"
          filter.frequency.setValueAtTime(2000, now)
          filter.frequency.exponentialRampToValueAtTime(800, now + 0.4)
          filter.Q.value = 3
          noise.connect(filter)
          filter.connect(gain)
          gain.gain.setValueAtTime(vol * 0.12, now)
          gain.gain.setValueAtTime(vol * 0.08, now + 0.1)
          gain.gain.setValueAtTime(vol * 0.15, now + 0.2)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
          noise.start(now)
          noise.stop(now + 0.8)
          break
        }
        case "satellite-beep": {
          // Two quick high-pitched beeps like a satellite ping
          for (let i = 0; i < 2; i++) {
            const o = ctx.createOscillator()
            o.type = "sine"
            o.frequency.value = 1800
            const g = ctx.createGain()
            o.connect(g)
            g.connect(master)
            const t = now + i * 0.12
            g.gain.setValueAtTime(vol * 0.15, t)
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
            o.start(t)
            o.stop(t + 0.08)
          }
          break
        }
        case "supernova": {
          // Massive low rumble with rising shimmer and shockwave
          const noise = createNoise(ctx, 4)
          const filter = ctx.createBiquadFilter()
          filter.type = "lowpass"
          filter.frequency.setValueAtTime(80, now)
          filter.frequency.exponentialRampToValueAtTime(6000, now + 1.5)
          filter.frequency.exponentialRampToValueAtTime(200, now + 4)
          noise.connect(filter)
          filter.connect(gain)
          gain.gain.setValueAtTime(0.001, now)
          gain.gain.linearRampToValueAtTime(vol * 0.6, now + 0.8)
          gain.gain.linearRampToValueAtTime(vol * 0.8, now + 1.5)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 4)
          noise.start(now)
          noise.stop(now + 4)
          // Rising shimmer
          const osc = ctx.createOscillator()
          osc.type = "sine"
          osc.frequency.setValueAtTime(200, now)
          osc.frequency.exponentialRampToValueAtTime(3000, now + 2)
          osc.frequency.exponentialRampToValueAtTime(100, now + 4)
          const sg = ctx.createGain()
          osc.connect(sg)
          sg.connect(master)
          sg.gain.setValueAtTime(vol * 0.15, now + 0.5)
          sg.gain.exponentialRampToValueAtTime(0.001, now + 4)
          osc.start(now + 0.5)
          osc.stop(now + 4)
          break
        }
      }
    },
    [getCtx]
  )

  const play = useCallback(
    (name: SoundName, options?: PlayOptions) => {
      try {
        createSound(name, options)
      } catch {
        // Silently fail
      }
    },
    [createSound]
  )

  const playLoop = useCallback(
    (name: SoundName, volume = 0.3) => {
      let active = true
      const loop = () => {
        if (!active) return
        play(name, { volume })
        const interval = name === "deep-space" ? 4000 : name === "blackhole-hum" ? 3000 : 2000
        setTimeout(loop, interval)
      }
      loop()
      return () => {
        active = false
      }
    },
    [play]
  )

  const setMasterVolume = useCallback((v: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = v
    }
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      mutedRef.current = !prev
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = !prev ? 0 : 0.5
      }
      return !prev
    })
  }, [])

  const engine: SoundEngine = {
    play,
    playLoop,
    setMasterVolume,
    isMuted,
    toggleMute,
    isReady,
    init,
  }

  return <SoundContext.Provider value={engine}>{children}</SoundContext.Provider>
}

function createNoise(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  return source
}
