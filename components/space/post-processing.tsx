"use client"

import { useEffect, useRef } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"

export function PostProcessing() {
  const { gl, camera, scene } = useThree()
  const composerRef = useRef<any>(null)

  useEffect(() => {
    // Create a simple post-processing effect using shaders directly
    // Since we don't have drei's EffectComposer readily available

    // Create render target for bloom effect
    const renderTarget = new THREE.WebGLRenderTarget(gl.domElement.width, gl.domElement.height, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    })

    // Bloom shader material
    const bloomShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        bloomStrength: { value: 1.2 },
        bloomRadius: { value: 0.5 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float bloomStrength;
        uniform float bloomRadius;
        varying vec2 vUv;
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          // Simple bloom by sampling nearby pixels
          vec4 bloom = vec4(0.0);
          float totalWeight = 0.0;
          
          for(float x = -2.0; x <= 2.0; x += 1.0) {
            for(float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * bloomRadius * 0.001;
              vec4 sample = texture2D(tDiffuse, vUv + offset);
              float weight = exp(-0.5 * (x*x + y*y));
              bloom += sample * weight;
              totalWeight += weight;
            }
          }
          
          bloom /= totalWeight;
          color += bloom * bloomStrength;
          
          gl_FragColor = color;
        }
      `,
    })

    // Vignette + Chromatic Aberration shader
    const effectShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        vignetteAmount: { value: 0.3 },
        chromaticAberrationAmount: { value: 0.002 },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float vignetteAmount;
        uniform float chromaticAberrationAmount;
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5);
          vec2 uv = vUv - center;
          
          // Chromatic aberration (only subtle when not extreme)
          float caAmount = chromaticAberrationAmount * (0.5 + sin(time * 0.3) * 0.3);
          vec4 color = vec4(0.0);
          color.r = texture2D(tDiffuse, uv + center + vec2(caAmount, 0.0)).r;
          color.g = texture2D(tDiffuse, uv + center).g;
          color.b = texture2D(tDiffuse, uv + center - vec2(caAmount, 0.0)).b;
          color.a = 1.0;
          
          // Vignette effect
          float dist = length(uv);
          float vignette = 1.0 - smoothstep(0.0, 0.8, dist);
          color.rgb *= mix(1.0, vignette, vignetteAmount);
          
          gl_FragColor = color;
        }
      `,
    })

    // Store for cleanup
    composerRef.current = {
      bloomShaderMaterial,
      effectShaderMaterial,
      renderTarget,
    }

    return () => {
      renderTarget.dispose()
      bloomShaderMaterial.dispose()
      effectShaderMaterial.dispose()
    }
  }, [gl])

  return null
}
