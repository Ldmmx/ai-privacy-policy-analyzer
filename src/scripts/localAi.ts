import {
  MLCEngineInterface,
  InitProgressReport,
  CreateMLCEngine,
  ChatCompletionMessageParam,
  prebuiltAppConfig,
} from "@mlc-ai/web-llm";

const defaultModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
// prebuiltAppConfig.model_list.forEach(({ model_id }) => console.log(`Available model: ${model_id}`));

let engine: MLCEngineInterface | null = null;
let history: ChatCompletionMessageParam[] = [];

export const isModelLoaded = () => engine !== null;

export const loadEngine = async (
  onModelLoaded: () => void,
  progressCallback: (report: InitProgressReport) => void,
  modelId = defaultModel
) => {
  try {

    engine = await CreateMLCEngine(modelId,
      { initProgressCallback: progressCallback },
      { context_window_size: -1, sliding_window_size: 1024, attention_sink_size: 4 });
    console.log("Engine loaded");
    await onModelLoaded();
  } catch (error) {
    console.error("Error loading engine:", error);
    throw new Error("Failed to load the engine.");
  }
};

export const clearHistory = () => { history = []; };

export async function chatStream(message, addToHistory = false, callback): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!engine) throw new Error("Engine not loaded");

    if (!addToHistory) {
      history = [{ role: "user", content: message }];
    } else {
      history.push({ role: "user", content: message });
    }

    const completion = engine.chat.completions.create({
      stream: true,
      messages: history,
    });
    completion.then(async (completion) => {
      for await (const chunk of completion) {
        const curDelta = chunk.choices[0].delta.content;
        if (curDelta) {
          callback(curDelta);
        }
      }
      resolve();
    }).catch((error) => {
      console.error("Error streaming chat:", error);
      reject();
    });
  });
}