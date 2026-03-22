"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function Starfield({ count = 5000 }) {
  const meshRef = useRef<THREE.Points>(null)
  const twinkleRef = useRef<Float32Array | null>(null)
  const depthRef = useRef<Float32Array | null>(null)

  const [positions, sizes, colors, baseSizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    const col = new Float32Array(count * 3)
    const base = new Float32Array(count)

    // Store depth for parallax effect
    if (!depthRef.current) {
      depthRef.current = new Float32Array(count)
    }

    for (let i = 0; i < count; i++) {
      const r = 200 + Math.random() * 1200
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      // Store depth for parallax - closer stars are bigger and brighter
      const depth = r / 1400 // 0 to ~1
      depthRef.current[i] = depth

      base[i] = (0.3 + Math.random() * 2.5) * (0.5 + depth * 0.8)
      s[i] = base[i]

      // Star color variety - brighter based on depth
      const temp = Math.random()
      const brightness = 0.5 + (1 - depth) * 0.5
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
      // Slower, more majestic rotation for deep space feel
      meshRef.current.rotation.y += delta * 0.0003
      meshRef.current.rotation.x += delta * 0.00015

      // Enhanced twinkling effect with depth consideration
      const t = state.clock.elapsedTime
      const sizeAttr = meshRef.current.geometry.attributes.size
      if (sizeAttr) {
        const arr = sizeAttr.array as Float32Array
        for (let i = 0; i < count; i++) {
          const depth = depthRef.current ? depthRef.current[i] : 0.5
          // Closer stars twinkle faster and more dramatically
          const twinkleDuration = 2 + depth * 3
          const twinkle = Math.sin(t * (Math.PI / twinkleDuration) + twinklePhases[i])
          // Brighter stars (closer) have more dramatic twinkling
          const twinkleAmount = 0.6 + (1 - depth) * 0.3
          arr[i] = baseSizes[i] * (twinkleAmount - twinkle * 0.2)
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
