/**
 * FFmpegConverter.ts - Convert WebM to MP4 using FFmpeg WASM.
 *
 * Lazy-loads the ~25MB WASM binary with progress callbacks.
 * Falls back to single-threaded mode when SharedArrayBuffer is unavailable.
 */

export interface ConversionProgress {
  phase: 'loading' | 'converting' | 'done' | 'error';
  progress: number; // 0-1
  message: string;
}

export type ProgressCallback = (progress: ConversionProgress) => void;

// Lazy singleton for FFmpeg instance
let ffmpegInstance: Awaited<ReturnType<typeof loadFFmpeg>> | null = null;
let loadingPromise: Promise<Awaited<ReturnType<typeof loadFFmpeg>>> | null = null;

async function loadFFmpeg() {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const ffmpeg = new FFmpeg();
  return ffmpeg;
}

async function getFFmpeg(onProgress?: ProgressCallback): Promise<Awaited<ReturnType<typeof loadFFmpeg>>> {
  if (ffmpegInstance) return ffmpegInstance;

  if (loadingPromise) {
    onProgress?.({ phase: 'loading', progress: 0.5, message: 'FFmpeg is already loading...' });
    return loadingPromise;
  }

  onProgress?.({ phase: 'loading', progress: 0, message: 'Loading FFmpeg WASM (~25 MB)...' });

  loadingPromise = (async () => {
    try {
      const ffmpeg = await loadFFmpeg();

      // Determine if we can use multithreaded mode
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

      // Load the WASM core
      const loaded = await ffmpeg.load({
        // When SharedArrayBuffer is not available, ffmpeg defaults to single-thread
        ...(hasSharedArrayBuffer ? {} : {}),
      });

      if (!loaded) {
        throw new Error('FFmpeg failed to load');
      }

      onProgress?.({ phase: 'loading', progress: 1, message: 'FFmpeg loaded successfully' });
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (err) {
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

/**
 * Convert a WebM blob to MP4.
 * @returns MP4 Blob
 */
export async function convertWebMToMP4(
  webmBlob: Blob,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  // Load FFmpeg
  let ffmpeg: Awaited<ReturnType<typeof loadFFmpeg>>;
  try {
    ffmpeg = await getFFmpeg(onProgress);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onProgress?.({ phase: 'error', progress: 0, message: `Failed to load FFmpeg: ${message}` });
    throw new Error(`Failed to load FFmpeg. Your browser may not support WebAssembly. (${message})`);
  }

  onProgress?.({ phase: 'converting', progress: 0, message: 'Preparing video data...' });

  try {
    const { fetchFile } = await import('@ffmpeg/util');

    // Set up progress listener
    ffmpeg.on('progress', ({ progress: p }) => {
      const clampedProgress = Math.max(0, Math.min(1, p));
      onProgress?.({
        phase: 'converting',
        progress: clampedProgress,
        message: `Converting... ${Math.round(clampedProgress * 100)}%`,
      });
    });

    // Write input file
    const inputData = await fetchFile(webmBlob);
    await ffmpeg.writeFile('input.webm', inputData);

    onProgress?.({ phase: 'converting', progress: 0.1, message: 'Converting WebM to MP4...' });

    // Run conversion: WebM -> MP4
    // Use libx264 for video, aac for audio if present
    await ffmpeg.exec([
      '-i', 'input.webm',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      'output.mp4',
    ]);

    // Read output
    const outputData = await ffmpeg.readFile('output.mp4');

    // Clean up files
    await ffmpeg.deleteFile('input.webm');
    await ffmpeg.deleteFile('output.mp4');

    // Convert to Blob - copy into a fresh ArrayBuffer to satisfy strict BlobPart typing
    let blobContent: ArrayBuffer;
    if (outputData instanceof Uint8Array) {
      blobContent = outputData.buffer.slice(
        outputData.byteOffset,
        outputData.byteOffset + outputData.byteLength,
      ) as ArrayBuffer;
    } else {
      blobContent = new TextEncoder().encode(outputData as string).buffer as ArrayBuffer;
    }
    const mp4Blob = new Blob([blobContent], { type: 'video/mp4' });

    if (mp4Blob.size === 0) {
      throw new Error('Conversion produced an empty file');
    }

    onProgress?.({ phase: 'done', progress: 1, message: 'Conversion complete!' });
    return mp4Blob;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    onProgress?.({ phase: 'error', progress: 0, message: `Conversion failed: ${message}` });
    throw new Error(`Failed to convert video. ${message}`);
  }
}
