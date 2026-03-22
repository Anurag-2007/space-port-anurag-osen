"use client"

import { useRef, useEffect, useCallback } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface CameraControllerProps {
  selectedPlanet: { x: number; z: number } | null
  launched: boolean
}

export function CameraController({ selectedPlanet, launched }: CameraControllerProps) {
  const { camera, gl } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 40, 60))
  const targetLook = useRef(new THREE.Vector3(0, 0, 0))
  const angleRef = useRef(0)

  // Mouse drag state
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const dragAngleX = useRef(0)
  const dragAngleY = useRef(0)

  // Touch state
  const lastTouch = useRef({ x: 0, y: 0 })
  const isTouching = useRef(false)
  const lastPinchDist = useRef(0)

  // Keyboard state
  const keysDown = useRef<Set<string>>(new Set())

  // Orbit distance (zoomable)
  const orbitDist = useRef(50)

  // Idle micro-drift state
  const lastInteraction = useRef(Date.now())
  const driftPhase = useRef(Math.random() * Math.PI * 2)

  // Smooth transition progress (for cinematic planet focus)
  const transitionProgress = useRef(0)
  const wasSelected = useRef<{ x: number; z: number } | null>(null)

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    lastInteraction.current = Date.now()
    orbitDist.current = Math.max(15, Math.min(120, orbitDist.current + e.deltaY * 0.05))
    angleRef.current += e.deltaY * 0.001
  }, [])

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.pointerType === "touch") return
    isDragging.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
    lastInteraction.current = Date.now()
    gl.domElement.style.cursor = "grabbing"
  }, [gl])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (e.pointerType === "touch") return
    if (!isDragging.current) return
    lastInteraction.current = Date.now()
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    dragAngleX.current += dx * 0.004
    dragAngleY.current = Math.max(-0.8, Math.min(0.8, dragAngleY.current + dy * 0.003))
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (e.pointerType === "touch") return
    isDragging.current = false
    gl.domElement.style.cursor = "default"
  }, [gl])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    lastInteraction.current = Date.now()
    if (e.touches.length === 1) {
      isTouching.current = true
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    lastInteraction.current = Date.now()
    if (e.touches.length === 1 && isTouching.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x
      const dy = e.touches[0].clientY - lastTouch.current.y
      dragAngleX.current += dx * 0.004
      dragAngleY.current = Math.max(-0.8, Math.min(0.8, dragAngleY.current + dy * 0.003))
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const delta = lastPinchDist.current - dist
      orbitDist.current = Math.max(15, Math.min(120, orbitDist.current + delta * 0.1))
      lastPinchDist.current = dist
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isTouching.current = false
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    lastInteraction.current = Date.now()
    keysDown.current.add(e.key.toLowerCase())
  }, [])
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysDown.current.delete(e.key.toLowerCase())
  }, [])

  useEffect(() => {
    const el = gl.domElement
    window.addEventListener("wheel", handleWheel, { passive: false })
    el.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: true })
    el.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("wheel", handleWheel)
      el.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      el.removeEventListener("touchstart", handleTouchStart)
      el.removeEventListener("touchmove", handleTouchMove)
      el.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown, handleKeyUp, gl])

  useFrame((state, delta) => {
    if (!launched) {
      camera.position.set(0, 100, 150)
      camera.lookAt(0, 0, 0)
      return
    }

    const t = state.clock.elapsedTime
    driftPhase.current += delta * 0.3

    // Keyboard controls
    const keys = keysDown.current
    const rotSpeed = 1.5 * delta
    if (keys.has("a") || keys.has("arrowleft")) dragAngleX.current += rotSpeed
    if (keys.has("d") || keys.has("arrowright")) dragAngleX.current -= rotSpeed
    if (keys.has("w") || keys.has("arrowup")) dragAngleY.current = Math.max(-0.8, dragAngleY.current - rotSpeed * 0.5)
    if (keys.has("s") || keys.has("arrowdown")) dragAngleY.current = Math.min(0.8, dragAngleY.current + rotSpeed * 0.5)
    if (keys.has("q")) orbitDist.current = Math.max(15, orbitDist.current - 20 * delta)
    if (keys.has("e")) orbitDist.current = Math.min(120, orbitDist.current + 20 * delta)

    // Idle micro-drift: subtle camera movement when no interaction for 3s
    const idleTime = (Date.now() - lastInteraction.current) / 1000
    const driftAmount = Math.min(idleTime / 10, 0.4) // ramps up gently over 10s
    const driftX = Math.sin(driftPhase.current * 0.7) * driftAmount * 0.3
    const driftY = Math.cos(driftPhase.current * 0.5) * driftAmount * 0.15

    // Track planet selection transitions
    if (selectedPlanet !== wasSelected.current) {
      transitionProgress.current = 0
      wasSelected.current = selectedPlanet
    }
    transitionProgress.current = Math.min(1, transitionProgress.current + delta * 1.5)
    // Smooth easing curve (ease-out cubic)
    const ease = 1 - Math.pow(1 - transitionProgress.current, 3)

    if (selectedPlanet) {
      targetPos.current.set(
        selectedPlanet.x * 0.7,
        8,
        selectedPlanet.z * 0.7 + 15
      )
      targetLook.current.set(selectedPlanet.x, 0, selectedPlanet.z)
    } else {
      const totalAngle = angleRef.current + dragAngleX.current + driftX
      const height = 20 + (dragAngleY.current + driftY) * 40
      targetPos.current.set(
        Math.sin(totalAngle) * orbitDist.current,
        Math.max(3, height),
        Math.cos(totalAngle) * orbitDist.current
      )
      targetLook.current.set(0, 0, 0)
    }

    // Use eased lerp factor - faster when transitioning to planet, slower on idle
    const lerpFactor = selectedPlanet ? 0.02 + ease * 0.03 : 0.03
    camera.position.lerp(targetPos.current, lerpFactor)

    const currentLook = new THREE.Vector3()
    camera.getWorldDirection(currentLook)
    const targetDir = targetLook.current.clone().sub(camera.position).normalize()
    currentLook.lerp(targetDir, lerpFactor * 1.2)
    camera.lookAt(
      camera.position.x + currentLook.x,
      camera.position.y + currentLook.y,
      camera.position.z + currentLook.z
    )
  })

  return null
}
