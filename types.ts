// Enums for strict typing based on the schema
export enum AssetType {
  SPHERE = 'sphere',
  CUBE = 'cube',
  CYLINDER = 'cylinder',
  GLB = 'glb_asset'
}

export enum MaterialClass {
  GLASS = 'GLASS',
  LIQUID = 'LIQUID',
  METAL = 'METAL',
  PLASTIC = 'PLASTIC',
  EMISSION = 'EMISSION',
  STONE = 'STONE'
}

export enum VFXType {
  FIRE = 'FIRE',
  SMOKE = 'SMOKE',
  BUBBLES = 'BUBBLES',
  SPARKS = 'SPARKS',
  FOG = 'FOG',
  LIQUID_WAVE = 'LIQUID_WAVE'
}

export enum ActionType {
  MOVE_TO = 'MOVE_TO',
  SCALE_TO = 'SCALE_TO',
  ROTATE_TO = 'ROTATE_TO',
  COLOR_SHIFT = 'COLOR_SHIFT',
  FADE_OUT = 'FADE_OUT',
  EMIT_PARTICLES = 'EMIT_PARTICLES',
  STOP_PARTICLES = 'STOP_PARTICLES'
}

export enum CameraZoom {
  CLOSE = 'CLOSE',
  MEDIUM = 'MEDIUM',
  WIDE = 'WIDE'
}

// Interfaces
export interface Transform {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

export interface PBRMaterial {
  material_class: MaterialClass | string;
  base_color: string;
  roughness: number;
  metalness: number;
  transmission?: number;
  ior?: number;
  thickness?: number;
}

export interface VFXConfig {
  color: string;
  density: 'LOW' | 'MEDIUM' | 'HIGH';
  speed: 'SLOW' | 'FAST';
  scale_multiplier?: number;
}

export interface VFXAsset {
  id: string;
  effect_type: VFXType | string;
  parent_actor_id?: string;
  config: VFXConfig;
  position_offset?: [number, number, number];
}

export interface StageAsset {
  id: string;
  type: AssetType | string;
  initial_transform: Transform;
  pbr_material: PBRMaterial;
}

export interface UIOverlay {
  target_actor_id: string;
  label_text: string;
  screen_offset: [number, number];
}

export interface VisualAction {
  actor_id: string;
  type: ActionType | string;
  target_value: any; // Mixed type in JSON (array for pos, string for color)
  easing: string;
}

export interface TimelineStep {
  step_id: number;
  duration_seconds: number;
  ui_display: {
    chapter_title: string;
    sidebar_explanation: string;
    chatbot_update: string;
  };
  visual_events: {
    camera_focus_target?: string;
    camera_zoom?: CameraZoom | string;
    actions: VisualAction[];
  };
}

export interface SimulationData {
  meta_data: {
    title: string;
    scientific_verdict: string;
    is_remix: boolean;
  };
  visual_settings: {
    environment_preset: string;
    post_processing: {
      bloom_intensity: number;
      vignette: boolean;
    };
  };
  lab_assistant_config: {
    bot_name: string;
    context_brief: string;
    suggested_questions: string[];
  };
  stage_assets: StageAsset[];
  vfx_layer: VFXAsset[];
  ui_overlays: UIOverlay[];
  sync_timeline: TimelineStep[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
