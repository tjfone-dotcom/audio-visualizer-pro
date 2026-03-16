import jsmediatags from 'jsmediatags';

export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface AudioMetadata {
  albumArtUrl: string | null;
  lyrics: LyricLine[];
}

/**
 * Parse LRC-format timestamps from lyrics text.
 * Handles formats like: [00:15.00]Line of lyrics
 */
function parseLrcLyrics(raw: string): LyricLine[] {
  const lines = raw.split(/\r?\n/);
  const result: LyricLine[] = [];
  const lrcRegex = /^\[(\d{1,2}):(\d{2})(?:[.:]\d{1,3})?\]\s*(.*)$/;

  for (const line of lines) {
    const match = lrcRegex.exec(line.trim());
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const text = match[3].trim();
      if (text) {
        result.push({ time: minutes * 60 + seconds, text });
      }
    }
  }

  if (result.length > 0) {
    result.sort((a, b) => a.time - b.time);
  }
  return result;
}

/**
 * Extract album art and lyrics from an audio file using jsmediatags.
 */
export function extractMetadata(file: File): Promise<AudioMetadata> {
  return new Promise((resolve) => {
    const result: AudioMetadata = { albumArtUrl: null, lyrics: [] };

    jsmediatags.read(file, {
      onSuccess(tag) {
        const tags = tag.tags;
        console.log('[metadata] Tags found:', Object.keys(tags));

        // Extract album art (APIC tag)
        const picture = tags.picture;
        if (picture) {
          const { data, format } = picture;
          // Convert byte array to Blob
          const byteArray = new Uint8Array(data);
          const blob = new Blob([byteArray], { type: format });
          result.albumArtUrl = URL.createObjectURL(blob);
          console.log('[metadata] Album art found:', format, data.length, 'bytes');
        }

        // Extract lyrics - check USLT (unsynchronized lyrics) tag
        // jsmediatags exposes it as tags.lyrics or tags.USLT
        const lyricsTag = tags.lyrics as { lyrics?: string } | undefined;
        const usltTag = tags.USLT as { data?: { lyrics?: string } } | undefined;

        let lyricsText: string | null = null;

        if (lyricsTag && typeof lyricsTag === 'object' && 'lyrics' in lyricsTag) {
          lyricsText = (lyricsTag as { lyrics: string }).lyrics;
        } else if (usltTag?.data?.lyrics) {
          lyricsText = usltTag.data.lyrics;
        } else if (typeof tags.lyrics === 'string') {
          lyricsText = tags.lyrics;
        }

        if (lyricsText) {
          console.log('[metadata] Lyrics found, length:', lyricsText.length);
          const parsed = parseLrcLyrics(lyricsText);
          if (parsed.length > 0) {
            result.lyrics = parsed;
            console.log('[metadata] Parsed', parsed.length, 'synced lyric lines');
          } else {
            console.log('[metadata] Lyrics found but no LRC timestamps');
          }
        }

        // Also check SYLT (synchronized lyrics) tag
        const syltTag = tags.SYLT as { data?: Array<{ text: string; timeStamp: number }> } | undefined;
        if (syltTag?.data && Array.isArray(syltTag.data) && result.lyrics.length === 0) {
          result.lyrics = syltTag.data.map((entry) => ({
            time: entry.timeStamp / 1000,
            text: entry.text,
          }));
          console.log('[metadata] SYLT synced lyrics found:', result.lyrics.length, 'lines');
        }

        console.log('[metadata] Result:', { hasArt: !!result.albumArtUrl, lyricsCount: result.lyrics.length });
        resolve(result);
      },
      onError(error) {
        console.warn('[metadata] Failed to extract:', error.type, error.info);
        resolve(result);
      },
    });
  });
}
