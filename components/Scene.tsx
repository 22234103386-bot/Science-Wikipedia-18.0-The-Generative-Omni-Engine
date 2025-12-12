import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Stars } from '@react-three/drei';
import { SimulationData, TimelineStep, VisualAction } from '../types';
import { Asset } from './Asset';
import { VFXSystem } from './VFXSystem';
import { Color } from 'three';

interface SceneProps {
  data: SimulationData;
  currentStepIndex: number;
  showLabels: boolean;
}

export const Scene: React.FC<SceneProps> = ({ data, currentStepIndex, showLabels }) => {
  const currentStep = data.sync_timeline[currentStepIndex];
  
  // Calculate active actions for this step
  const getActionsForActor = (actorId: string): VisualAction[] => {
    return currentStep?.visual_events.actions.filter(a => a.actor_id === actorId) || [];
  };

  const isNight = data.visual_settings.environment_preset === 'night' || data.visual_settings.environment_preset === 'space';

  // Separate Global VFX from Attached VFX
  const attachedVFX = (data.vfx_layer || []).filter(v => v.parent_actor_id);
  const globalVFX = (data.vfx_layer || []).filter(v => !v.parent_actor_id);

  return (
    <div className="w-full h-full relative bg-black/90">
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 45 }}>
        <color attach="background" args={[isNight ? '#050505' : '#1a1a1a']} />
        
        {/* Environment & Lighting */}
        <ambientLight intensity={isNight ? 0.2 : 0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Environment preset={data.visual_settings.environment_preset === 'night' ? 'city' : 'studio'} />
        {isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
        
        {/* Floor Shadows */}
        <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={20} blur={2} far={4.5} />
        
        {/* Actors with Attached VFX */}
        <group position={[0, 0, 0]}>
          {data.stage_assets.map(asset => {
             // Find VFX attached to this asset
             const myVFX = attachedVFX.filter(v => v.parent_actor_id === asset.id);
             
             return (
              <Asset 
                key={asset.id} 
                asset={asset} 
                activeActions={getActionsForActor(asset.id)}
                stepProgress={0.5} // Simplified for this demo
              >
                  {myVFX.map(vfx => <VFXSystem key={vfx.id} data={vfx} />)}
              </Asset>
             );
          })}
        </group>

        {/* Global VFX Layer */}
        <group>
            {globalVFX.map(vfx => <VFXSystem key={vfx.id} data={vfx} />)}
        </group>

        {/* Controls */}
        <OrbitControls makeDefault />
      </Canvas>

      {/* 2D Overlays - Toggleable */}
      {showLabels && <OverlayLayer data={data} />}
    </div>
  );
};

// Helper for UI Overlays (Basic Implementation)
const OverlayLayer: React.FC<{ data: SimulationData }> = ({ data }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {data.ui_overlays.map((overlay, idx) => (
        <div 
            key={idx}
            className="absolute bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-2 transition-all duration-300"
            style={{ 
                left: `calc(50% + ${overlay.screen_offset[0]}px)`, 
                top: `calc(50% - ${overlay.screen_offset[1]}px)`
            }}
        >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {overlay.label_text}
        </div>
      ))}
    </div>
  );
}
