import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, BufferGeometry, Float32BufferAttribute, Color, AdditiveBlending, Vector3 } from 'three';
import { VFXAsset, VFXType } from '../types';

interface VFXSystemProps {
  data: VFXAsset;
}

export const VFXSystem: React.FC<VFXSystemProps> = ({ data }) => {
  const pointsRef = useRef<Points>(null);
  const { effect_type, config, position_offset } = data;
  
  // Configuration Mappings
  const count = config.density === 'HIGH' ? 300 : config.density === 'MEDIUM' ? 150 : 50;
  const speedMultiplier = config.speed === 'FAST' ? 2.0 : 0.5;
  const scale = config.scale_multiplier || 1.0;
  const color = useMemo(() => new Color(config.color), [config.color]);

  // Initialize Particle Data
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count); // 0 to 1
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      resetParticle(i, positions, velocities, lifetimes, sizes, effect_type as VFXType, true);
    }

    return { positions, velocities, lifetimes, sizes };
  }, [count, effect_type]);

  // Helper to reset a particle
  function resetParticle(
    i: number, 
    pos: Float32Array, 
    vel: Float32Array, 
    life: Float32Array, 
    sz: Float32Array, 
    type: VFXType,
    initial = false
  ) {
    const i3 = i * 3;
    
    // Default: Reset to origin (0,0,0) with some spread
    pos[i3] = (Math.random() - 0.5) * 0.5 * scale;
    pos[i3 + 1] = (Math.random() - 0.5) * 0.5 * scale;
    pos[i3 + 2] = (Math.random() - 0.5) * 0.5 * scale;

    life[i] = initial ? Math.random() : 1.0; // Start fresh

    // Type-Specific Behaviors
    switch (type) {
      case VFXType.FIRE:
        pos[i3 + 1] = 0; // Start at base
        vel[i3] = (Math.random() - 0.5) * 0.2;
        vel[i3 + 1] = Math.random() * 2.0 + 1.0; // Upward
        vel[i3 + 2] = (Math.random() - 0.5) * 0.2;
        sz[i] = Math.random() * 0.5 + 0.5;
        break;
      case VFXType.SMOKE:
        pos[i3 + 1] = 0;
        vel[i3] = (Math.random() - 0.5) * 0.5;
        vel[i3 + 1] = Math.random() * 1.0 + 0.5; // Slow Upward
        vel[i3 + 2] = (Math.random() - 0.5) * 0.5;
        sz[i] = Math.random() * 1.0 + 1.0;
        break;
      case VFXType.SPARKS:
        pos[i3] = 0; pos[i3+1] = 0; pos[i3+2] = 0; // Burst from center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = Math.random() * 5.0 + 2.0;
        vel[i3] = speed * Math.sin(phi) * Math.cos(theta);
        vel[i3 + 1] = speed * Math.cos(phi);
        vel[i3 + 2] = speed * Math.sin(phi) * Math.sin(theta);
        sz[i] = Math.random() * 0.2 + 0.1;
        break;
      case VFXType.BUBBLES:
        pos[i3] = (Math.random() - 0.5) * scale;
        pos[i3 + 1] = (Math.random() - 0.5) * scale;
        pos[i3 + 2] = (Math.random() - 0.5) * scale;
        vel[i3] = 0;
        vel[i3 + 1] = Math.random() * 0.5 + 0.2; // Slowly float up
        vel[i3 + 2] = 0;
        sz[i] = Math.random() * 0.2 + 0.1;
        break;
      case VFXType.FOG:
        pos[i3] = (Math.random() - 0.5) * 10 * scale;
        pos[i3 + 1] = (Math.random() - 0.5) * 2 * scale; // Low lying
        pos[i3 + 2] = (Math.random() - 0.5) * 10 * scale;
        vel[i3] = (Math.random() - 0.5) * 0.1;
        vel[i3 + 1] = 0;
        vel[i3 + 2] = (Math.random() - 0.5) * 0.1;
        sz[i] = Math.random() * 2.0 + 2.0;
        break;
      default:
        vel[i3] = 0; vel[i3+1] = 0.5; vel[i3+2] = 0;
        sz[i] = 1;
    }
  }

  // Animation Loop
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position as Float32BufferAttribute;
    const positions = posAttr.array as Float32Array;
    // We don't have velocity/life attributes in geometry, using closure variables
    // Optimization: In a real engine, use custom shader material for performance.
    
    // Update Particles
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Move
      particles.lifetimes[i] -= delta * speedMultiplier * (effect_type === VFXType.SPARKS ? 2.0 : 0.5);
      
      if (particles.lifetimes[i] <= 0) {
        resetParticle(i, positions, particles.velocities, particles.lifetimes, particles.sizes, effect_type as VFXType);
      } else {
        positions[i3] += particles.velocities[i3] * delta * speedMultiplier;
        positions[i3 + 1] += particles.velocities[i3 + 1] * delta * speedMultiplier;
        positions[i3 + 2] += particles.velocities[i3 + 2] * delta * speedMultiplier;
        
        // Gravity/Drag simulation
        if (effect_type === VFXType.SPARKS) {
          particles.velocities[i3 + 1] -= 9.8 * delta * 0.5; // Gravity
        }
        if (effect_type === VFXType.BUBBLES) {
             positions[i3] += Math.sin(state.clock.elapsedTime * 5 + i) * 0.01; // Wobble
        }
      }
    }
    
    posAttr.needsUpdate = true;
  });

  // Geometry construction
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(particles.positions, 3));
    return geo;
  }, [particles]);

  const offset = position_offset || [0,0,0];

  return (
    <points ref={pointsRef} position={new Vector3(...offset)}>
      <primitive object={geometry} />
      <pointsMaterial
        color={color}
        size={0.2 * scale}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
