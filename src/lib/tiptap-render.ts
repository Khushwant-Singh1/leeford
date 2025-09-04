import { generateHTML } from '@tiptap/html';
import { JSONContent } from '@tiptap/core';
import { tiptapExtensions } from './tiptap-extensions'; // <-- Import from shared file

export function renderTiptapContent(content: JSONContent | null | undefined): string {
  if (!content) return '';
  
  // Use the shared extensions here as well
  return generateHTML(content, tiptapExtensions);
}