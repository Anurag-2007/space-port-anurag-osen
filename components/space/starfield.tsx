"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function Starfield({ count = 5000 }) {
  const meshRef = useRef<THREE.Points>(null)
  const twinkleRef = useRef<Float32Array | null>(null)

  const [positions, sizes, colors, baseSizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    const col = new Float32Array(count * 3)
    const base = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Multi-layer depth: near (large, bright), mid, far (tiny, dim)
      const depthLayer = Math.random()
      let r: number
      let brightness: number

      if (depthLayer < 0.3) {
        // Near stars - large and bright
        r = 200 + Math.random() * 300
        brightness = 0.8 + Math.random() * 0.2
      } else if (depthLayer < 0.65) {
        // Mid stars - medium
        r = 500 + Math.random() * 400
        brightness = 0.5 + Math.random() * 0.4
      } else {
        // Far stars - tiny and dim
        r = 900 + Math.random() * 500
        brightness = 0.2 + Math.random() * 0.3
      }

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      // Size based on depth
      base[i] = (0.3 + Math.random() * 2) * (1 - depthLayer * 0.5)
      s[i] = base[i]

      // Star color variety with brightness modulation
      const temp = Math.random()
      if (temp < 0.3) {
        // Blue/white hot stars
        col[i * 3] = (0.7 + Math.random() * 0.3) * brightness
        col[i * 3 + 1] = (0.8 + Math.random() * 0.2) * brightness
        col[i * 3 + 2] = brightness
      } else if (temp < 0.5) {
        // Yellow stars
        col[i * 3] = brightness
        col[i * 3 + 1] = (0.9 + Math.random() * 0.1) * brightness
        col[i * 3 + 2] = (0.6 + Math.random() * 0.2) * brightness
      } else if (temp < 0.65) {
        // Red giants
        col[i * 3] = brightness
        col[i * 3 + 1] = (0.4 + Math.random() * 0.2) * brightness
        col[i * 3 + 2] = (0.2 + Math.random() * 0.2) * brightness
      } else if (temp < 0.8) {
        // Cyan
        col[i * 3] = (0.3 + Math.random() * 0.2) * brightness
        col[i * 3 + 1] = (0.8 + Math.random() * 0.2) * brightness
        col[i * 3 + 2] = (0.9 + Math.random() * 0.1) * brightness
      } else {
        // White
        col[i * 3] = (0.9 + Math.random() * 0.1) * brightness
        col[i * 3 + 1] = (0.9 + Math.random() * 0.1) * brightness
        col[i * 3 + 2] = (0.9 + Math.random() * 0.1) * brightness
      }
    }

    return [pos, s, col, base]
  }, [count])

  // Store twinkle phases
  const twinklePhases = useMemo(() => {
    return new Float32Array(count).map(() => Math.random() * Math.PI * 2)
  }, [count])

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Slow rotation for deep space
      meshRef.current.rotation.y += delta * 0.0005
      meshRef.current.rotation.x += delta * 0.00025

      // Enhanced twinkling with depth-based variation
      const t = state.clock.elapsedTime
      const sizeAttr = meshRef.current.geometry.attributes.size
      if (sizeAttr) {
        const arr = sizeAttr.array as Float32Array
        for (let i = 0; i < count; i++) {
          // Different twinkle rates based on star depth
          const twinklRate = 0.5 + (twinklePhases[i] % 1.5)
          const twinkle = Math.sin(t * twinklRate + twinklePhases[i])
          // Near stars twinkle more, far stars are steadier
          const depth = (i % 3) / 3
          arr[i] = baseSizes[i] * (0.5 + twinkle * (0.4 + depth * 0.2))
        }
        sizeAttr.needsUpdate = true
      }
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  )
}
