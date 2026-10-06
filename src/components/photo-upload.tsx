'use client';

import { useRef, type ChangeEvent } from 'react';
import { readImageFile, type ImagePayload } from '@/lib/files';

interface PhotoUploadProps {
  imageUrl?: string | null;
  busy?: boolean;
  onUpload: (payload: ImagePayload) => void;
  onError?: (message: string) => void;
  size?: number;
  label?: string;
}

export default function PhotoUpload({ imageUrl, busy, onUpload, onError, size = 56, label = 'Photo' }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    try {
      onUpload(await readImageFile(file));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not read file.');
    }
  }

  return (
    <div style={styles.wrap}>
      <div
        style={{
          ...styles.thumb,
          width: size,
          height: size,
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        }}
      />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} style={styles.button(busy)}>
        {busy ? 'Uploading…' : imageUrl ? `Change ${label}` : `Add ${label}`}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={styles.hiddenInput} />
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as React.CSSProperties,
  thumb: {
    borderRadius: 8,
    border: '1px solid rgba(201,168,76,0.3)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flexShrink: 0,
  } as React.CSSProperties,
  button: (busy?: boolean): React.CSSProperties => ({
    backgroundColor: 'transparent',
    border: '1px solid rgba(245,236,215,0.25)',
    borderRadius: 4,
    padding: '6px 12px',
    color: 'rgba(245,236,215,0.7)',
    fontFamily: 'var(--font-raleway)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    cursor: busy ? 'default' : 'pointer',
    opacity: busy ? 0.6 : 1,
    whiteSpace: 'nowrap',
  }),
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  } as React.CSSProperties,
};
