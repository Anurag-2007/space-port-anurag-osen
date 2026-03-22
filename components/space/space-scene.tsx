"use client"

import { useRef, useState, useMemo, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { Starfield } from "./starfield"
import { Sun } from "./sun"
import { Planet } from "./planet"
import { BlackHole } from "./black-hole"
import { Nebula } from "./nebula"
import { AsteroidBelt } from "./asteroid-belt"
import { ShootingStars } from "./shooting-stars"
import { SpaceDust } from "./space-dust"
import { CameraController } from "./camera-controller"
import { PLANETS } from "./planet-data"
import * as THREE from "three"

interface SpaceSceneProps {
  launched: boolean
  selectedPlanet: string | null
  onSelectPlanet: (id: string | null) => void
  idleMeteorShower?: boolean
}

/* Rogue planet - a tiny hidden planet far from center, only visible when zoomed out */
function RoguePlanet({ onSelect }: { onSelect: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003
      const t = state.clock.elapsedTime
      meshRef.current.position.y = -12 + Math.sin(t * 0.15) * 0.5
    }
  })

  return (
    <group position={[-95, -12, -80]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = "default"
        }}
      >
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#334455"
          emissive="#112233"
          emissiveIntensity={hovered ? 1.2 : 0.3}
          roughness={0.5}
          metalness={0.4}
        />
      </mesh>
      {/* Faint glow */}
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#334455" transparent opacity={hovered ? 0.12 : 0.03} side={THREE.BackSide} />
      </mesh>
      {hovered && (
        <Html center distanceFactor={25} style={{ pointerEvents: "none" }}>
          <div className="glass-panel-bright rounded px-3 py-1.5 whitespace-nowrap">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-semibold">
              ROGUE PLANET
            </span>
            <div className="font-mono text-[8px] text-muted-foreground/60 mt-0.5">
              Click to reveal secrets
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

/* Idle meteor shower - spawns many more meteors when idle */
function IdleMeteorShower({ active }: { active: boolean }) {
  const starsRef = useRef<Array<{
    start: THREE.Vector3
    direction: THREE.Vector3
    speed: number
    life: number
    maxLife: number
  }>>([])
  const [, setTick] = useState(0)

  useFrame((state) => {
    if (!active) {
      starsRef.current = []
      return
    }
    const t = state.clock.elapsedTime

    // Spawn rapidly when active
    if (starsRef.current.length < 12 && Math.random() < 0.08) {
      const startPos = new THREE.Vector3(
        (Math.random() - 0.5) * 200,
        40 + Math.random() * 40,
        (Math.random() - 0.5) * 200
      )
      starsRef.current.push({
        start: startPos,
        direction: new THREE.Vector3(
          (Math.random() - 0.5),
          -0.6 - Math.random() * 0.3,
          (Math.random() - 0.5)
        ).normalize(),
        speed: 50 + Math.random() * 80,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.8,
      })
    }

    starsRef.current = starsRef.current.filter((s) => {
      s.life += 1 / 60
      return s.life < s.maxLife
    })
    setTick((v) => v + 1)
  })

  if (!active) return null

  return (
    <group>
      {starsRef.current.map((star, i) => {
        const progress = star.life / star.maxLife
        const headPos = star.start.clone().add(star.direction.clone().multiplyScalar(star.speed * star.life))
        const tailLen = Math.min(star.speed * 0.1, star.speed * star.life)
        const tailPos = headPos.clone().sub(star.direction.clone().multiplyScalar(tailLen))
        const opacity = progress < 0.1 ? progress * 10 : progress > 0.6 ? (1 - progress) / 0.4 : 1

        return (
          <group key={`idle-meteor-${i}`}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    tailPos.x, tailPos.y, tailPos.z,
                    headPos.x, headPos.y, headPos.z,
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#aaddff" transparent opacity={opacity * 0.7} linewidth={1} />
            </line>
            <mesh position={headPos}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function SceneContent({ launched, selectedPlanet, onSelectPlanet, idleMeteorShower }: SpaceSceneProps) {
  const timeRef = useRef(0)
  const [time, setTime] = useState(0)
  const [showRoguePanel, setShowRoguePanel] = useState(false)

  useFrame((_, delta) => {
    timeRef.current += delta
    setTime(timeRef.current)
  })

  const selectedPlanetPosition = useMemo(() => {
    if (!selectedPlanet) return null
    const planet = PLANETS.find((p) => p.id === selectedPlanet)
    if (!planet) return null
    const angle = time * planet.orbitSpeed
    return {
      x: Math.cos(angle) * planet.orbitRadius,
      z: Math.sin(angle) * planet.orbitRadius,
    }
  }, [selectedPlanet, time])

  const handleSelectPlanet = useCallback(
    (id: string) => {
      onSelectPlanet(selectedPlanet === id ? null : id)
    },
    [selectedPlanet, onSelectPlanet]
  )

  return (
    <>
      <CameraController selectedPlanet={selectedPlanetPosition} launched={launched} />

      {/* Ambient lighting */}
      <ambientLight intensity={0.12} color="#4a6a8a" />

      {/* Enhanced starfield with parallax layers */}
      <Starfield count={7000} />

      {/* Space dust particles */}
      <SpaceDust count={800} />

      {/* Nebula clouds */}
      <Nebula />

      {/* Sun */}
      <Sun />

      {/* All planets with axial tilt */}
      {PLANETS.map((planet) => (
        <Planet
          key={planet.id}
          data={planet}
          isSelected={selectedPlanet === planet.id}
          onSelect={handleSelectPlanet}
          time={time}
        />
      ))}

      {/* Asteroid belt */}
      <AsteroidBelt innerRadius={56} outerRadius={62} count={300} />
      <AsteroidBelt innerRadius={80} outerRadius={90} count={200} />

      {/* Shooting stars */}
      <ShootingStars />

      {/* Idle meteor shower */}
      <IdleMeteorShower active={!!idleMeteorShower} />

      {/* Interactive black hole */}
      <BlackHole />

      {/* Secret rogue planet - far out, tiny */}
      <RoguePlanet onSelect={() => setShowRoguePanel((v) => !v)} />

      {/* Rogue planet info overlay */}
      {showRoguePanel && (
        <Html
          position={[-95, -7, -80]}
          center
          distanceFactor={30}
        >
          <div className="glass-panel-bright rounded-lg p-4 w-64 pointer-events-auto">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/30">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
                  ROGUE ARCHIVES
                </span>
              </div>
              <button
                onClick={() => setShowRoguePanel(false)}
                className="font-mono text-[10px] text-muted-foreground hover:text-primary cursor-pointer"
              >
                [X]
              </button>
            </div>
            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="flex items-start gap-2 text-foreground/60">
                <span className="text-chart-4">*</span>
                <span>Side experiment: AI-generated music visualizer</span>
              </div>
              <div className="flex items-start gap-2 text-foreground/60">
                <span className="text-chart-4">*</span>
                <span>Unreleased: Neural network art generator</span>
              </div>
              <div className="flex items-start gap-2 text-foreground/60">
                <span className="text-chart-4">*</span>
                <span>Risky prototype: Real-time voice translator</span>
              </div>
              <div className="flex items-start gap-2 text-foreground/60">
                <span className="text-chart-4">*</span>
                <span>Shelved: Procedural planet generator</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border/20">
              <span className="font-mono text-[8px] text-muted-foreground/30 uppercase tracking-widest">
                These never shipped. But they taught me everything.
              </span>
            </div>
          </div>
        </Html>
      )}
    </>
  )
}

export function SpaceScene({ launched, selectedPlanet, onSelectPlanet, idleMeteorShower }: SpaceSceneProps) {
  return (
    <div className="fixed inset-0 w-full h-screen">
      <Canvas
        camera={{ position: [0, 40, 60], fov: 60, near: 0.1, far: 3000 }}
        gl={{
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.4,
        }}
        onPointerMissed={() => onSelectPlanet(null)}
      >
        <color attach="background" args={["#020610"]} />
        <fog attach="fog" args={["#020610", 200, 1200]} />
        <SceneContent
          launched={launched}
          selectedPlanet={selectedPlanet}
          onSelectPlanet={onSelectPlanet}
          idleMeteorShower={idleMeteorShower}
        />
      </Canvas>
    </div>
  )
}
