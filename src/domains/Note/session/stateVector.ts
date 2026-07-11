import * as Y from 'yjs';

export function encodeNoteClientStateVector(doc: Y.Doc): string {
  const bytes = Y.encodeStateVector(doc);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return window.btoa(binary);
}
