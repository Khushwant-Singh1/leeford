import { StarterKit } from '@tiptap/starter-kit';
import ListItem from '@tiptap/extension-list-item';
import {TextStyle} from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

// This is the single source of truth for your Tiptap extensions.
// Both the editor and the server-side renderer will use this.
export const tiptapExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    bulletList: {
      keepMarks: true,
      keepAttributes: false, // Recommended for clean HTML output
      HTMLAttributes: {
        class: 'list-disc pl-6',
      },
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false, // Recommended for clean HTML output
      HTMLAttributes: {
        class: 'list-decimal pl-6',
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: 'border-l-4 border-muted-foreground pl-4 italic',
      },
    },
  }),
  ListItem,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  Image.configure({
    inline: true,
    allowBase64: true, // Be cautious with this in production due to large data URLs
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: {
      class: 'text-primary underline hover:text-primary/80',
    },
  }),
  Placeholder.configure({
    placeholder: 'Start writing your story...',
  }),
  CharacterCount,
];
