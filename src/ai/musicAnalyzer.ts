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
 * Convert music characteristics + optional user hint into a structured image generation prompt.
 * Uses a role-based prompt format for higher quality, more artistic results.
 */
export function generatePromptFromCharacteristics(
  chars: MusicCharacteristics,
  userHint?: string,
): string {
  const styleHintLine = userHint?.trim()
    ? `* Style hint: ${userHint.trim()}`
    : '* Style hint: (none provided - choose freely)';

  return `[Role Definition]
You are the world's most renowned album cover art designer. You don't just generate images; you are a visionary who transmutes the soul and acoustic characteristics of music into visual masterpieces. Every design you create must be original, profound, and a perfect visual manifestation of the auditory experience.

[Mission]
Analyze the provided musical parameters and create a highly detailed, creative, and artistic album cover image that represents the music's identity.

[Input Parameters]
* Energy: ${chars.energy}
* Bass Weight: ${chars.bassWeight}
* Dominant Range: ${chars.dominantRange}
* Dynamic Range: ${chars.dynamicRange}
* Estimated BPM: ${chars.estimatedBPM}
* Mood: ${chars.mood}
${styleHintLine}

[Generation Guidelines]
* Original Conceptualization: Do not just list parameters. Combine them into a cohesive visual narrative.
* Art Style Selection: Choose a modern, sophisticated style that suits the genre.
* Mandatory Constraints:
  - No text (no lyrics, artist names, titles, watermarks, or signatures).`;
}
