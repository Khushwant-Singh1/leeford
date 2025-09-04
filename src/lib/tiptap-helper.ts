import { generateHTML } from '@tiptap/html';
import { StarterKit } from '@tiptap/starter-kit';
import { JSONContent } from '@tiptap/core';

// This function will convert the Tiptap JSON to safe HTML on the server
export function renderTiptapContent(content: JSONContent | null | undefined): string {
  if (!content) return '';
  
  return generateHTML(content, [
    StarterKit.configure({
      // Configure any extensions as needed
    }),
    // Add any other custom Tiptap extensions you used in the editor
  ]);
}