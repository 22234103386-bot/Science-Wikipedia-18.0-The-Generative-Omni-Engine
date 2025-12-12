import { GoogleGenAI, Type } from "@google/genai";
import { OMNI_ENGINE_SYSTEM_PROMPT } from "../constants";
import { SimulationData, ChatMessage } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the schema for structured output to ensure valid JSON
const simulationSchema = {
  type: Type.OBJECT,
  properties: {
    meta_data: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        scientific_verdict: { type: Type.STRING },
        is_remix: { type: Type.BOOLEAN },
      },
    },
    visual_settings: {
      type: Type.OBJECT,
      properties: {
        environment_preset: { type: Type.STRING },
        post_processing: {
          type: Type.OBJECT,
          properties: {
            bloom_intensity: { type: Type.NUMBER },
            vignette: { type: Type.BOOLEAN },
          },
        },
      },
    },
    lab_assistant_config: {
      type: Type.OBJECT,
      properties: {
        bot_name: { type: Type.STRING },
        context_brief: { type: Type.STRING },
        suggested_questions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    },
    stage_assets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING },
          initial_transform: {
            type: Type.OBJECT,
            properties: {
              position: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              scale: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              rotation: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            },
          },
          pbr_material: {
            type: Type.OBJECT,
            properties: {
              material_class: { type: Type.STRING },
              base_color: { type: Type.STRING },
              roughness: { type: Type.NUMBER },
              metalness: { type: Type.NUMBER },
              transmission: { type: Type.NUMBER },
              ior: { type: Type.NUMBER },
              thickness: { type: Type.NUMBER },
            },
          },
        },
      },
    },
    vfx_layer: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          effect_type: { type: Type.STRING },
          parent_actor_id: { type: Type.STRING },
          config: {
             type: Type.OBJECT,
             properties: {
                color: { type: Type.STRING },
                density: { type: Type.STRING },
                speed: { type: Type.STRING },
                scale_multiplier: { type: Type.NUMBER }
             }
          },
          position_offset: { type: Type.ARRAY, items: { type: Type.NUMBER } }
        }
      }
    },
    ui_overlays: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          target_actor_id: { type: Type.STRING },
          label_text: { type: Type.STRING },
          screen_offset: { type: Type.ARRAY, items: { type: Type.NUMBER } },
        },
      },
    },
    sync_timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step_id: { type: Type.NUMBER },
          duration_seconds: { type: Type.NUMBER },
          ui_display: {
            type: Type.OBJECT,
            properties: {
              chapter_title: { type: Type.STRING },
              sidebar_explanation: { type: Type.STRING },
              chatbot_update: { type: Type.STRING },
            },
          },
          visual_events: {
            type: Type.OBJECT,
            properties: {
              camera_focus_target: { type: Type.STRING },
              camera_zoom: { type: Type.STRING },
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    actor_id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    target_value: { type: Type.STRING }, // Keeping strict JSON schema simpler for Mixed types, model will cast
                    easing: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const generateSimulation = async (query: string, mode: 'STANDARD' | 'WHAT_IF_REMIX'): Promise<SimulationData> => {
  try {
    const inputPayload = JSON.stringify({ user_query: query, mode: mode });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: inputPayload,
      config: {
        systemInstruction: OMNI_ENGINE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    // Parse JSON
    return JSON.parse(text) as SimulationData;
  } catch (error) {
    console.error("Simulation Generation Error:", error);
    throw error;
  }
};

export const chatWithAssistant = async (
  currentMessage: string, 
  history: ChatMessage[], 
  contextBrief: string
): Promise<string> => {
  try {
    const systemPrompt = `You are an expert science tutor named inside the 'Science Omni-Engine'.
    CONTEXT FOR CURRENT SIMULATION: ${contextBrief}
    
    Answer the user's questions based on this specific simulation context. Keep answers concise (under 50 words) and conversational.`;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: currentMessage });
    return result.text || "I'm having trouble analyzing the data right now.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Connection to the Science Core interrupted.";
  }
};
