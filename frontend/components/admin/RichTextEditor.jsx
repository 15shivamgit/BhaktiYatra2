'use client';

import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading3, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react';
import { useEffect } from 'react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Rich text for admin content. Only formatting the API keeps after sanitising is offered
 * (headings, bold, italic, lists, quotes, links), so what admins see is what visitors get.
 * @param {{ id: string, label: string, value: string, onChange: (html: string) => void, error?: string }} props
 */
export default function RichTextEditor({ id, label, value, onChange, error }) {
  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch in Next.js
    extensions: [
      StarterKit.configure({
        heading: { levels: [3, 4] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': `${id}-label`,
        ...(error && { 'aria-invalid': 'true', 'aria-describedby': `${id}-error` }),
        class: 'rich-text min-h-48 max-w-none px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  // Follow external value changes (form reset after save) without moving the caret on typing.
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if ((value || '') !== current) editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            heading: e.isActive('heading', { level: 3 }),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            link: e.isActive('link'),
          }
        : {},
  });

  const setLink = () => {
    const previous = editor.getAttributes('link').href ?? '';
    const url = window.prompt(t('adminContent.linkPrompt'), previous);
    if (url === null) return;
    if (url === '') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const tools = [
    {
      key: 'heading',
      icon: Heading3,
      label: t('adminContent.heading'),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      key: 'bold',
      icon: Bold,
      label: t('adminContent.bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      icon: Italic,
      label: t('adminContent.italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'bullet',
      icon: List,
      label: t('adminContent.bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'ordered',
      icon: ListOrdered,
      label: t('adminContent.numberedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'quote',
      icon: Quote,
      label: t('adminContent.quote'),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    { key: 'link', icon: Link2, label: t('adminContent.link'), run: setLink },
  ];

  return (
    <div className="space-y-1.5">
      <p id={`${id}-label`} className="text-sm font-medium text-text">
        {label}
      </p>
      <div
        className={cn(
          'overflow-hidden rounded-md border bg-surface',
          error ? 'border-danger' : 'border-border',
        )}
      >
        <div
          role="toolbar"
          aria-label={label}
          className="flex flex-wrap gap-1 border-b border-border bg-surface-muted p-1"
        >
          {tools.map(({ key, icon: Icon, label: toolLabel, run }) => (
            <button
              key={key}
              type="button"
              onClick={run}
              disabled={!editor}
              aria-pressed={Boolean(state?.[key])}
              aria-label={toolLabel}
              title={toolLabel}
              className={cn(
                'flex size-9 items-center justify-center rounded-sm text-text hover:bg-surface',
                state?.[key] && 'bg-surface text-primary',
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
