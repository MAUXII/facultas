"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Heading2,
  Heading3,
  Image as ImageIcon,
  Quote,
  Minus,
  List,
  ListOrdered,
  Paperclip,
  Plus,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { uploadComunidadeCover } from "@/lib/cover-upload";
import { isEmptyRichText, toRenderableHtml } from "@/lib/sanitize-html";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type EditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  userId?: string;
  className?: string;
};

const MENU = [
  { id: "heading", label: "Heading", icon: Heading2 },
  { id: "subheading", label: "Subheading", icon: Heading3 },
  { id: "image", label: "Imagem", icon: ImageIcon },
  { id: "quote", label: "Quote", icon: Quote },
  { id: "divider", label: "Divider", icon: Minus },
  { id: "list", label: "Lista", icon: List },
  { id: "ordered", label: "Lista numerada", icon: ListOrdered },
  { id: "file", label: "Anexo", icon: Paperclip },
] as const;

export function RichDescriptionEditor({
  value,
  onChange,
  placeholder = "Descrição do grupo",
  userId,
  className,
}: EditorProps) {
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const placeholderRef = useRef(placeholder);
  const [menuOpen, setMenuOpen] = useState(false);
  placeholderRef.current = placeholder;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noreferrer", target: "_blank" },
      }),
      Placeholder.configure({
        placeholder: () => placeholderRef.current,
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "min-h-[108px] text-sm leading-relaxed text-white outline-none",
      },
    },
    onUpdate: ({ editor: next }) => {
      onChange(next.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (isEmptyRichText(value) && isEmptyRichText(current)) return;
    if (value !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [editor, value]);

  const uploadFile = async (file: File) => {
    if (!userId) {
      toast({
        title: "Faça login para enviar arquivos",
        variant: "destructive",
      });
      return null;
    }
    try {
      return await uploadComunidadeCover(userId, file);
    } catch (err) {
      console.error(err);
      toast({
        title: "Não deu para enviar o arquivo",
        variant: "destructive",
      });
      return null;
    }
  };

  const runItem = (id: (typeof MENU)[number]["id"]) => {
    if (!editor) return;
    if (id === "heading") {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (id === "subheading") {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    } else if (id === "image") {
      imageRef.current?.click();
    } else if (id === "quote") {
      editor.chain().focus().toggleBlockquote().run();
    } else if (id === "divider") {
      editor.chain().focus().setHorizontalRule().run();
    } else if (id === "list") {
      editor.chain().focus().toggleBulletList().run();
    } else if (id === "ordered") {
      editor.chain().focus().toggleOrderedList().run();
    } else if (id === "file") {
      fileRef.current?.click();
    }
    if (id !== "image" && id !== "file") setMenuOpen(false);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const url = await uploadFile(file);
    if (!url) return;
    editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    setMenuOpen(false);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const url = await uploadFile(file);
    if (!url) return;
    editor
      .chain()
      .focus()
      .insertContent(
        `<p><a href="${url}" target="_blank" rel="noreferrer">${file.name}</a></p>`
      )
      .run();
    setMenuOpen(false);
  };

  return (
    <div
      className={cn(
        "relative",
        className ?? "rounded-xl bg-[var(--ff-surface)]",
      )}
    >
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white"
            aria-label="Inserir bloco"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-56 p-1.5 text-white"
        >
          {MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => runItem(item.id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <item.icon className="h-4 w-4 shrink-0 text-white/45" strokeWidth={1.5} />
              {item.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onPickImage(e)}
      />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => void onPickFile(e)}
      />

      <div className="ff-prose px-11 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export function RichDescriptionView({ html }: { html: string }) {
  const safe = toRenderableHtml(html);
  if (!safe) return null;
  return (
    <div
      className="ff-prose max-w-full"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
