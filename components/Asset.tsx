import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Color, Vector3, Euler } from 'three';
import { StageAsset, VisualAction, MaterialClass, AssetType } from '../types';

interface AssetProps {
  asset: StageAsset;
  activeActions: VisualAction[];
  stepProgress: number; // 0 to 1 representing progress through current step
  children?: React.ReactNode;
}

export const Asset: React.FC<AssetProps> = ({ asset, activeActions, stepProgress, children }) => {
  const meshRef = useRef<Mesh>(null);
  
  // Initial State Memoization
  const initialPos = useMemo(() => new Vector3(...asset.initial_transform.position), [asset]);
  const initialScale = useMemo(() => new Vector3(...asset.initial_transform.scale), [asset]);
  const initialRot = useMemo(() => new Euler(...asset.initial_transform.rotation), [asset]);
  const baseColor = useMemo(() => new Color(asset.pbr_material.base_color), [asset]);

  // Geometry Factory
  const Geometry = () => {
    switch (asset.type) {
      case AssetType.SPHERE: return <sphereGeometry args={[1, 32, 32]} />;
      case AssetType.CUBE: return <boxGeometry args={[1, 1, 1]} />;
      case AssetType.CYLINDER: return <cylinderGeometry args={[1, 1, 2, 32]} />;
      default: return <sphereGeometry args={[1, 16, 16]} />;
    }
  };

  // Material Factory
  const Material = () => {
    const { pbr_material } = asset;
    const commonProps = {
      color: pbr_material.base_color,
      roughness: pbr_material.roughness,
      metalness: pbr_material.metalness,
    };

    if (pbr_material.material_class === MaterialClass.GLASS || pbr_material.material_class === MaterialClass.LIQUID) {
      return (
        <meshPhysicalMaterial
          {...commonProps}
          transmission={pbr_material.transmission ?? 1.0}
          thickness={pbr_material.thickness ?? 1.0}
          ior={pbr_material.ior ?? 1.5}
          transparent
        />
      );
    }
    
    if (pbr_material.material_class === MaterialClass.EMISSION) {
      return (
        <meshStandardMaterial
          {...commonProps}
          emissive={pbr_material.base_color}
          emissiveIntensity={2}
        />
      );
    }

    return <meshStandardMaterial {...commonProps} />;
  };

  // Animation Loop
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Reset to something close to previous state or calculate cleanly?
    // For this engine, we will linearly interpolate based on active actions.
    // If no action targets a property, it stays at current (or initial if step 0).
    // Note: A robust system needs a complete state machine. 
    // Simplified: We interpolate from "Current Real Position" to "Target" if action exists.
    
    const actionMove = activeActions.find(a => a.type === 'MOVE_TO');
    const actionScale = activeActions.find(a => a.type === 'SCALE_TO');
    const actionRotate = activeActions.find(a => a.type === 'ROTATE_TO');
    const actionColor = activeActions.find(a => a.type === 'COLOR_SHIFT');

    if (actionMove && Array.isArray(actionMove.target_value)) {
        const target = new Vector3(...(actionMove.target_value as unknown as [number, number, number]));
        meshRef.current.position.lerp(target, 0.1); // Simple lerp for smoothness
    } else if (!actionMove && stepProgress === 0) {
        // Snap back on reset only
        // meshRef.current.position.copy(initialPos); 
        // In a real app we'd track 'last known position', for now we let it persist or drift
    }

    if (actionScale && Array.isArray(actionScale.target_value)) {
        const target = new Vector3(...(actionScale.target_value as unknown as [number, number, number]));
        meshRef.current.scale.lerp(target, 0.1);
    }

    if (actionRotate && Array.isArray(actionRotate.target_value)) {
       // Simple rotation interpolation
       const targetEuler = new Euler(...(actionRotate.target_value as unknown as [number, number, number]));
       // Lerping euler is tricky, usually convert to Quat. 
       // Quick Hack:
       meshRef.current.rotation.x += (targetEuler.x - meshRef.current.rotation.x) * 0.1;
       meshRef.current.rotation.y += (targetEuler.y - meshRef.current.rotation.y) * 0.1;
       meshRef.current.rotation.z += (targetEuler.z - meshRef.current.rotation.z) * 0.1;
    }
    
    // Initial Setup on mount
    if (activeActions.length === 0 && stepProgress === 0) {
         meshRef.current.position.lerp(initialPos, 0.1);
         meshRef.current.scale.lerp(initialScale, 0.1);
         meshRef.current.rotation.x = initialRot.x;
         meshRef.current.rotation.y = initialRot.y;
         meshRef.current.rotation.z = initialRot.z;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <Geometry />
      <Material />
      {children}
    </mesh>
  );
};
