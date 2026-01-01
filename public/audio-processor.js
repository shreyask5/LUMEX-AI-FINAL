// AudioWorklet Processor for audio input processing
// This runs in the AudioWorklet thread (separate from main thread)

class AudioInputProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // If we have input audio data
    if (input && input.length > 0) {
      const inputData = input[0]; // First channel

      // Send the audio data to the main thread
      if (inputData && inputData.length > 0) {
        // Copy the Float32Array to prevent detached buffer issues
        const audioCopy = new Float32Array(inputData);
        this.port.postMessage({ audioData: audioCopy });
      }
    }

    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor('audio-input-processor', AudioInputProcessor);
