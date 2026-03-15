/**
 * musicAnalyzer.ts - Analyze audio frequency data to determine music characteristics.
 *
 * Uses an AnalyserNode to sample frequency data and derive energy level,
 * bass weight, dominant frequency range, dynamic range, estimated BPM, and mood.
 */

export interface MusicCharacteristics {
  energy: 'high' | 'medium' | 'low';
  bassWeight: 'heavy' | 'balanced' | 'light';
  dominantRange: 'bass' | 'mid' | 'treble';
  dynamicRange: 'wide' | 'narrow';
  estimatedBPM: number;
  mood: string;
}

/**
 * Collect frequency snapshots over a period of time and compute characteristics.
 * Samples the analyser every ~50ms for `durationMs` milliseconds (default 3 seconds).
 */
export function analyzeMusicCharacteristics(
  analyserNode: AnalyserNode,
  durationMs = 3000,
): Promise<MusicCharacteristics> {
  return new Promise((resolve) => {
    const binCount = analyserNode.frequencyBinCount; // typically 1024
    const sampleRate = analyserNode.context.sampleRate;
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / binCount;

    // Frequency band boundaries in bins
    const bassCutoff = Math.floor(250 / binWidth);   // ~0-250 Hz
    const midCutoff = Math.floor(2000 / binWidth);    // ~250-2000 Hz
    // treble: 2000 Hz - nyquist

    const snapshots: Uint8Array[] = [];
    const intervalMs = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      const data = new Uint8Array(binCount);
      analyserNode.getByteFrequencyData(data);
      snapshots.push(data);
      elapsed += intervalMs;

      if (elapsed >= durationMs) {
        clearInterval(timer);
        resolve(computeCharacteristics(snapshots, bassCutoff, midCutoff, binCount));
      }
    }, intervalMs);
  });
}

/**
 * Synchronous single-frame analysis for when you only have one snapshot.
 */
export function analyzeSingleFrame(analyserNode: AnalyserNode): MusicCharacteristics {
  const binCount = analyserNode.frequencyBinCount;
  const sampleRate = analyserNode.context.sampleRate;
  const nyquist = sampleRate / 2;
  const binWidth = nyquist / binCount;

  const bassCutoff = Math.floor(250 / binWidth);
  const midCutoff = Math.floor(2000 / binWidth);

  const data = new Uint8Array(binCount);
  analyserNode.getByteFrequencyData(data);

  return computeCharacteristics([data], bassCutoff, midCutoff, binCount);
}

function computeCharacteristics(
  snapshots: Uint8Array[],
  bassCutoff: number,
  midCutoff: number,
  binCount: number,
): MusicCharacteristics {
  const numSnapshots = snapshots.length;
  if (numSnapshots === 0) {
    return {
      energy: 'medium',
      bassWeight: 'balanced',
      dominantRange: 'mid',
      dynamicRange: 'narrow',
      estimatedBPM: 120,
      mood: 'ambient electronic',
    };
  }

  // Compute per-snapshot averages and band energies
  const frameEnergies: number[] = [];
  let totalBassEnergy = 0;
  let totalMidEnergy = 0;
  let totalTrebleEnergy = 0;

  for (const data of snapshots) {
    let sum = 0;
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    for (let i = 0; i < binCount; i++) {
      const val = data[i];
      sum += val;
      if (i < bassCutoff) {
        bassSum += val;
      } else if (i < midCutoff) {
        midSum += val;
      } else {
        trebleSum += val;
      }
    }

    frameEnergies.push(sum / binCount);
    totalBassEnergy += bassSum / bassCutoff;
    totalMidEnergy += midSum / (midCutoff - bassCutoff);
    totalTrebleEnergy += trebleSum / (binCount - midCutoff);
  }

  const avgEnergy = frameEnergies.reduce((a, b) => a + b, 0) / numSnapshots;
  const avgBass = totalBassEnergy / numSnapshots;
  const avgMid = totalMidEnergy / numSnapshots;
  const avgTreble = totalTrebleEnergy / numSnapshots;
  const totalBandEnergy = avgBass + avgMid + avgTreble;

  // Energy level (0-255 scale, byte frequency data)
  const energy: MusicCharacteristics['energy'] =
    avgEnergy > 120 ? 'high' : avgEnergy > 60 ? 'medium' : 'low';

  // Bass weight
  const bassRatio = totalBandEnergy > 0 ? avgBass / totalBandEnergy : 0.33;
  const bassWeight: MusicCharacteristics['bassWeight'] =
    bassRatio > 0.45 ? 'heavy' : bassRatio > 0.3 ? 'balanced' : 'light';

  // Dominant range
  const dominantRange: MusicCharacteristics['dominantRange'] =
    avgBass >= avgMid && avgBass >= avgTreble
      ? 'bass'
      : avgMid >= avgTreble
        ? 'mid'
        : 'treble';

  // Dynamic range from energy variance
  const energyVariance =
    frameEnergies.reduce((acc, e) => acc + (e - avgEnergy) ** 2, 0) / numSnapshots;
  const energyStdDev = Math.sqrt(energyVariance);
  const dynamicRange: MusicCharacteristics['dynamicRange'] =
    energyStdDev > 25 ? 'wide' : 'narrow';

  // Estimate BPM from energy peaks
  const estimatedBPM = estimateBPM(frameEnergies, 50);

  // Generate mood string
  const mood = deriveMood(energy, bassWeight, dominantRange, dynamicRange);

  return { energy, bassWeight, dominantRange, dynamicRange, estimatedBPM, mood };
}

/**
 * Simple BPM estimation using autocorrelation on frame energy values.
 * intervalMs = time between frames.
 */
function estimateBPM(frameEnergies: number[], intervalMs: number): number {
  if (frameEnergies.length < 10) return 120; // not enough data

  // Normalize energies
  const mean = frameEnergies.reduce((a, b) => a + b, 0) / frameEnergies.length;
  const normalized = frameEnergies.map((e) => e - mean);

  // Autocorrelation for BPM range 60-200 (periods in frames)
  const minBPM = 60;
  const maxBPM = 200;
  const framesPerSecond = 1000 / intervalMs;
  const minLag = Math.floor((framesPerSecond * 60) / maxBPM);
  const maxLag = Math.ceil((framesPerSecond * 60) / minBPM);

  let bestLag = minLag;
  let bestCorrelation = -Infinity;

  for (let lag = minLag; lag <= Math.min(maxLag, normalized.length - 1); lag++) {
    let correlation = 0;
    const count = normalized.length - lag;
    for (let i = 0; i < count; i++) {
      correlation += normalized[i] * normalized[i + lag];
    }
    correlation /= count;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  const bpm = Math.round((framesPerSecond * 60) / bestLag);
  // Clamp to reasonable range
  return Math.max(60, Math.min(200, bpm));
}

function deriveMood(
  energy: MusicCharacteristics['energy'],
  bassWeight: MusicCharacteristics['bassWeight'],
  dominantRange: MusicCharacteristics['dominantRange'],
  dynamicRange: MusicCharacteristics['dynamicRange'],
): string {
  const descriptors: string[] = [];

  // Energy-based mood words
  if (energy === 'high') {
    descriptors.push('energetic', 'intense');
  } else if (energy === 'medium') {
    descriptors.push('flowing', 'rhythmic');
  } else {
    descriptors.push('calm', 'ambient');
  }

  // Bass character
  if (bassWeight === 'heavy') {
    descriptors.push('deep');
  } else if (bassWeight === 'light') {
    descriptors.push('airy');
  }

  // Frequency character
  if (dominantRange === 'bass') {
    descriptors.push('rumbling');
  } else if (dominantRange === 'treble') {
    descriptors.push('bright');
  } else {
    descriptors.push('warm');
  }

  // Dynamic character
  if (dynamicRange === 'wide') {
    descriptors.push('dramatic');
  } else {
    descriptors.push('steady');
  }

  return descriptors.join(', ');
}

/**
 * Convert music characteristics + optional user hint into an image generation prompt.
 */
export function generatePromptFromCharacteristics(
  chars: MusicCharacteristics,
  userHint?: string,
): string {
  const parts: string[] = ['Album cover art, abstract digital artwork'];

  // Color palette based on energy and frequency
  if (chars.energy === 'high') {
    if (chars.dominantRange === 'bass') {
      parts.push('deep red and orange fire tones, explosive energy');
    } else if (chars.dominantRange === 'treble') {
      parts.push('electric blue and white lightning, bright neon streaks');
    } else {
      parts.push('vibrant purple and magenta gradients, dynamic motion');
    }
  } else if (chars.energy === 'medium') {
    if (chars.dominantRange === 'bass') {
      parts.push('warm amber and bronze tones, smooth flowing shapes');
    } else if (chars.dominantRange === 'treble') {
      parts.push('cool cyan and teal, crystalline patterns');
    } else {
      parts.push('rich purple and indigo, organic wave forms');
    }
  } else {
    if (chars.dominantRange === 'bass') {
      parts.push('deep navy and dark purple, misty and ethereal');
    } else if (chars.dominantRange === 'treble') {
      parts.push('soft pastel pink and lavender, delicate and floating');
    } else {
      parts.push('muted earth tones, tranquil and serene');
    }
  }

  // Bass weight influences texture
  if (chars.bassWeight === 'heavy') {
    parts.push('heavy textured layers, bold geometric forms');
  } else if (chars.bassWeight === 'light') {
    parts.push('wispy translucent layers, fine detailed patterns');
  }

  // Dynamic range influences composition
  if (chars.dynamicRange === 'wide') {
    parts.push('strong contrast between light and shadow, cinematic depth');
  }

  // BPM influences visual rhythm
  if (chars.estimatedBPM > 150) {
    parts.push('fast rhythmic repeating patterns');
  } else if (chars.estimatedBPM < 80) {
    parts.push('slow sweeping curves, meditative');
  }

  parts.push(`mood: ${chars.mood}`);

  // Append user hint if provided
  if (userHint?.trim()) {
    parts.push(userHint.trim());
  }

  parts.push('high quality, no text, no words, square format');

  return parts.join('. ');
}
