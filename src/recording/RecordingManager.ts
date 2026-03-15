/**
 * RecordingManager - Handles recording the visualization canvas as a WebM video.
 *
 * Flow:
 * 1. Capture canvas video stream at 24fps
 * 2. Get audio stream from AudioEngine's gain node via MediaStreamDestination
 * 3. Combine video + audio into a single MediaStream
 * 4. Record with MediaRecorder (VP9+Opus, VP8 fallback)
 * 5. Collect chunks and produce a downloadable Blob on stop
 */

import { AudioEngine } from '../audio/AudioEngine';

export class RecordingManager {
  private canvas: HTMLCanvasElement;
  private audioEngine: AudioEngine;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private recording = false;
  private audioDestination: MediaStreamAudioDestinationNode | null = null;

  constructor(canvas: HTMLCanvasElement, audioEngine: AudioEngine) {
    this.canvas = canvas;
    this.audioEngine = audioEngine;
  }

  /** Determine the best supported mimeType for recording */
  private getMimeType(): string {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];

    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }

    // Fallback to basic webm
    return 'video/webm';
  }

  /** Start recording */
  start(): void {
    if (this.recording) return;

    this.chunks = [];

    // 1. Get video stream from canvas
    const videoStream = this.canvas.captureStream(24);

    // 2. Get audio stream from AudioEngine
    this.audioDestination = this.audioEngine.createMediaStreamDestination();
    const audioStream = this.audioDestination.stream;

    // 3. Combine video + audio tracks
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);

    // 4. Create MediaRecorder
    const mimeType = this.getMimeType();
    this.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    });

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Request data every second for more reliable recording
    this.mediaRecorder.start(1000);
    this.recording = true;
  }

  /** Stop recording and return the WebM blob */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.recording) {
        reject(new Error('Not currently recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.chunks = [];
        this.recording = false;

        // Disconnect the audio destination
        if (this.audioDestination) {
          this.audioEngine.disconnectMediaStreamDestination(this.audioDestination);
          this.audioDestination = null;
        }

        this.mediaRecorder = null;
        resolve(blob);
      };

      this.mediaRecorder.onerror = () => {
        this.recording = false;
        this.mediaRecorder = null;

        // Disconnect the audio destination
        if (this.audioDestination) {
          this.audioEngine.disconnectMediaStreamDestination(this.audioDestination);
          this.audioDestination = null;
        }

        reject(new Error('Recording failed'));
      };

      this.mediaRecorder.stop();
    });
  }

  /** Check if currently recording */
  isRecording(): boolean {
    return this.recording;
  }
}
