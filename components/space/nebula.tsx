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
    if (group1Ref.current) {
      group1Ref.current.rotation.y += delta * 0.001
      // Gentle pulsing
      const s = 1 + Math.sin(t * 0.3) * 0.03
      group1Ref.current.scale.setScalar(s)
    }
    if (group2Ref.current) {
      group2Ref.current.rotation.y -= delta * 0.0015
      const s = 1 + Math.cos(t * 0.4) * 0.02
      group2Ref.current.scale.setScalar(s)
    }
    if (group3Ref.current) {
      group3Ref.current.rotation.y += delta * 0.0008
      group3Ref.current.rotation.z += delta * 0.0003
    }

    // Trigger random explosions
    if (!explosion && Math.random() < 0.0005) {
      setExplosion(true)
      explosionTime.current = 0
    }

    // Animate explosion
    if (explosion && explosionRef.current) {
      explosionTime.current += delta
      const positions = explosionRef.current.geometry.attributes.position.array as Float32Array
      const progress = explosionTime.current / 3

      for (let i = 0; i < 400; i++) {
        const v = explosionVelocities[i]
        positions[i * 3] = -20 + v.vx * explosionTime.current * 10
        positions[i * 3 + 1] = 30 + v.vy * explosionTime.current * 10
        positions[i * 3 + 2] = -100 + v.vz * explosionTime.current * 10
      }
      explosionRef.current.geometry.attributes.position.needsUpdate = true

      if (progress > 1) {
        setExplosion(false)
        // Reset positions
        for (let i = 0; i < 400; i++) {
          positions[i * 3] = -20
          positions[i * 3 + 1] = 30
          positions[i * 3 + 2] = -100
        }
        explosionRef.current.geometry.attributes.position.needsUpdate = true
      }
    }
  })

  return (
    <>
      {/* Main nebula cloud - cyan */}
      <points ref={group1Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={800} array={positions1} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={2.5}
          color="#00c8dc"
          transparent
          opacity={0.12}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Secondary cloud - orange */}
      <points ref={group2Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={600} array={positions2} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={3}
          color="#ff6600"
          transparent
          opacity={0.08}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Third cloud - purple/magenta accent */}
      <points ref={group3Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={500} array={positions3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={2}
          color="#cc44ff"
          transparent
          opacity={0.06}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Nebula core glow lights - volumetric */}
      <pointLight position={[-70, 20, -60]} color="#00c8dc" intensity={8} distance={80} decay={2} />
      <pointLight position={[40, -15, -80]} color="#ff6600" intensity={5} distance={60} decay={2} />
      <pointLight position={[-20, 30, -100]} color="#cc44ff" intensity={4} distance={70} decay={2} />

      {/* Volumetric glow spheres for nebula cores */}
      <mesh position={[-70, 20, -60]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#00c8dc" transparent opacity={0.02} side={THREE.BackSide} />
      </mesh>
      <mesh position={[40, -15, -80]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.015} side={THREE.BackSide} />
      </mesh>
      <mesh position={[-20, 30, -100]}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshBasicMaterial color="#cc44ff" transparent opacity={0.012} side={THREE.BackSide} />
      </mesh>

      {/* Explosion particles */}
      {explosion && (
        <>
          <points ref={explosionRef}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={400}
                array={explosionPositions}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={1.5}
              color="#ffaa00"
              transparent
              opacity={Math.max(0, 0.8 - explosionTime.current / 3)}
              depthWrite={false}
              sizeAttenuation
            />
          </points>
          {/* Explosion flash */}
          <pointLight
            position={[-20, 30, -100]}
            color="#ffaa00"
            intensity={Math.max(0, 50 - explosionTime.current * 20)}
            distance={80}
            decay={2}
          />
        </>
      )}
    </>
  )
}
