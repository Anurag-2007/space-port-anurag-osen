"use client"

import { useRef, useMemo, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function Nebula() {
  const group1Ref = useRef<THREE.Points>(null)
  const group2Ref = useRef<THREE.Points>(null)
  const group3Ref = useRef<THREE.Points>(null)
  const explosionRef = useRef<THREE.Points>(null)
  const [explosion, setExplosion] = useState(false)
  const explosionTime = useRef(0)

  const [positions1, positions2, positions3, explosionPositions] = useMemo(() => {
    const createCloud = (
      centerX: number,
      centerY: number,
      centerZ: number,
      count: number,
      spread: number
    ) => {
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        // Gaussian-like distribution for more natural nebula shape
        const r = spread * Math.pow(Math.random(), 0.5)
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        pos[i * 3] = centerX + r * Math.sin(phi) * Math.cos(theta)
        pos[i * 3 + 1] = centerY + r * Math.sin(phi) * Math.sin(theta) * 0.4
        pos[i * 3 + 2] = centerZ + r * Math.cos(phi)
      }
      return pos
    }

    // Explosion particles starting from center
    const explCount = 400
    const explPos = new Float32Array(explCount * 3)
    for (let i = 0; i < explCount; i++) {
      explPos[i * 3] = 0
      explPos[i * 3 + 1] = 0
      explPos[i * 3 + 2] = 0
    }

    return [
      createCloud(-70, 20, -60, 800, 25),
      createCloud(40, -15, -80, 600, 20),
      createCloud(-20, 30, -100, 500, 30),
      explPos,
    ]
  }, [])

  // Store explosion velocities
  const explosionVelocities = useMemo(() => {
    return Array.from({ length: 400 }, () => {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 0.5 + Math.random() * 2
      return {
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed,
      }
    })
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    // Layer 1: Slow parallax rotation
    if (group1Ref.current) {
      group1Ref.current.rotation.z += delta * 0.02
      group1Ref.current.rotation.y += delta * 0.015
    }

    // Layer 2: Medium parallax rotation
    if (group2Ref.current) {
      group2Ref.current.rotation.z += delta * 0.035
      group2Ref.current.rotation.y += delta * 0.025
    }

    // Layer 3: Fast parallax rotation
    if (group3Ref.current) {
      group3Ref.current.rotation.z += delta * 0.05
      group3Ref.current.rotation.y += delta * 0.035
    }

    // Explosion animation
    if (explosion && explosionRef.current) {
      explosionTime.current += delta
      if (explosionTime.current > 1.5) {
        setExplosion(false)
        explosionTime.current = 0
      }

      const posAttr = explosionRef.current.geometry.getAttribute("position") as THREE.BufferAttribute
      const posArray = posAttr.array as Float32Array

      for (let i = 0; i < 400; i++) {
        const angle = (i / 400) * Math.PI * 2
        const speed = 30 + (i % 5) * 10
        const distance = speed * explosionTime.current
        const x = Math.cos(angle) * distance
        const y = (Math.random() - 0.5) * distance
        const z = Math.sin(angle) * distance

        posArray[i * 3] = x
        posArray[i * 3 + 1] = y
        posArray[i * 3 + 2] = z
      }
      posAttr.needsUpdate = true
    }
  })

  return (
    <>
      {/* Multi-layer nebula with parallax depth */}
      {/* Layer 1: Far background nebula - moves slowest */}
      <group scale={1.2} position={[-70, 20, -200]}>
        <points ref={group1Ref}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={800} array={positions1} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={8} sizeAttenuation transparent opacity={0.08} color="#ff00ff" />
        </points>
      </group>

      {/* Layer 2: Mid nebula */}
      <group scale={0.9} position={[40, -15, -150]}>
        <points ref={group2Ref}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={600} array={positions2} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={12} sizeAttenuation transparent opacity={0.12} color="#0099ff" />
        </points>
      </group>

      {/* Layer 3: Close nebula - moves fastest, more opaque */}
      <group scale={1.1} position={[-20, 30, -80]}>
        <points ref={group3Ref}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={500} array={positions3} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={15} sizeAttenuation transparent opacity={0.18} color="#00ddff" />
        </points>
      </group>

      {/* Explosion effect for interactivity */}
      {explosion && (
        <points ref={explosionRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={400}
              array={explosionPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial size={4} sizeAttenuation transparent opacity={0.6} color="#ffff00" />
        </points>
      )}
    </>
  )
}
