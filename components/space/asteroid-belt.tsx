"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface AsteroidBeltProps {
  innerRadius?: number
  outerRadius?: number
  count?: number
}

export function AsteroidBelt({ innerRadius = 48, outerRadius = 55, count = 300 }: AsteroidBeltProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const asteroids = useMemo(() => {
    return Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: innerRadius + Math.random() * (outerRadius - innerRadius),
      y: (Math.random() - 0.5) * 3,
      speed: 0.005 + Math.random() * 0.01,
      scale: 0.05 + Math.random() * 0.2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      wobble: Math.random() * Math.PI * 2,
    }))
  }, [count, innerRadius, outerRadius])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime

    asteroids.forEach((a, i) => {
      const angle = a.angle + t * a.speed
      const wobbleY = Math.sin(t * 0.5 + a.wobble) * 0.5
      dummy.position.set(
        Math.cos(angle) * a.radius,
        a.y + wobbleY,
        Math.sin(angle) * a.radius
      )
      dummy.rotation.set(t * a.rotSpeed, t * a.rotSpeed * 1.3, t * a.rotSpeed * 0.7)
      dummy.scale.setScalar(a.scale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color="#8a7a6a"
        roughness={0.9}
        metalness={0.1}
        emissive="#3a2a1a"
        emissiveIntensity={0.15}
      />
    </instancedMesh>
  )
}
