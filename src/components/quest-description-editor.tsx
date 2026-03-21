import { type Component, createMemo, createResource, createSignal, Show } from "solid-js";
import type { QuestDescriptionAsset } from "~/bindings";
import {
  createDescriptionAssetReferenceMarkdown,
  renderDescriptionMarkdown,
  resolveDescriptionAssetMap,
} from "~/lib/quest-description";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

interface Props {
  value: string;
  assets: QuestDescriptionAsset[];
  onChange: (value: string) => void;
  onUploadFile: (file: File) => Promise<QuestDescriptionAsset | null>;
  placeholder?: string;
  compact?: boolean;
  class?: string;
}

const readClipboardFiles = (event: ClipboardEvent): File[] => {
  const directFiles = Array.from(event.clipboardData?.files ?? []);
  if (directFiles.length > 0) {
    return directFiles;
  }

  return Array.from(event.clipboardData?.items ?? [])
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
};

export const QuestDescriptionEditor: Component<Props> = (props) => {
  let textareaRef!: HTMLTextAreaElement;
  let fileInputRef!: HTMLInputElement;

  const [previewEnabled, setPreviewEnabled] = createSignal(false);
  const [isUploading, setIsUploading] = createSignal(false);
  const [assetMap] = createResource(
    () => props.assets.map((asset) => `${asset.id}:${asset.relativePath}:${asset.mimeType}:${asset.originalFilename ?? ""}`).join("|"),
    () => resolveDescriptionAssetMap(props.assets),
  );

  const previewHtml = createMemo(() => renderDescriptionMarkdown(props.value, assetMap() ?? {}));

  const insertAtCursor = (snippet: string) => {
    const textarea = textareaRef;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const currentValue = props.value;
    const nextValue = `${currentValue.slice(0, selectionStart)}${snippet}${currentValue.slice(selectionEnd)}`;
    const nextCaretPosition = selectionStart + snippet.length;

    props.onChange(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      for (const file of files) {
        const asset = await props.onUploadFile(file);
        if (!asset) {
          continue;
        }

        const needsSeparator = props.value.length > 0 && !props.value.endsWith("\n");
        const snippet = `${needsSeparator ? "\n" : ""}${createDescriptionAssetReferenceMarkdown(asset, file.name)}\n`;
        insertAtCursor(snippet);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    const clipboardFiles = readClipboardFiles(event);
    if (clipboardFiles.length === 0) {
      return;
    }

    event.preventDefault();
    void uploadFiles(clipboardFiles);
  };

  const handleDragOver = (event: DragEvent) => {
    if (!event.dataTransfer?.types.includes("Files")) {
      return;
    }

    event.preventDefault();
  };

  const handleDrop = (event: DragEvent) => {
    const droppedFiles = Array.from(event.dataTransfer?.files ?? []);
    if (droppedFiles.length === 0) {
      return;
    }

    event.preventDefault();
    void uploadFiles(droppedFiles);
  };

  return (
    <div
      class={cn("pixel-description-editor", props.class)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Show
        when={previewEnabled()}
        fallback={
          <textarea
            ref={textareaRef}
            value={props.value}
            onInput={(event) => props.onChange(event.currentTarget.value)}
            onPaste={(event) => handlePaste(event)}
            class={cn(
              "pixel-field min-h-[180px] resize-y",
              props.compact && "min-h-[140px]",
            )}
            placeholder={props.placeholder ?? "write a task description..."}
          />
        }
      >
        <div
          class={cn(
            "pixel-description-surface min-h-[180px]",
            props.compact && "min-h-[140px]",
            !props.value.trim() && "text-[var(--muted-color)]",
          )}
        >
          <Show when={props.value.trim()} fallback={<span>nothing to preview yet</span>}>
            <div class="pixel-markdown" innerHTML={previewHtml()} />
          </Show>
        </div>
      </Show>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading()}
          onClick={() => fileInputRef.click()}
        >
          {isUploading() ? "uploading..." : "file"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPreviewEnabled((value) => !value)}
        >
          {previewEnabled() ? "edit markdown" : "preview"}
        </Button>
      </div>

      <span class="type-copy text-[0.74rem] text-[var(--muted-color)]">
        markdown, paste, and drop files supported
      </span>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        class="hidden"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = "";
          void uploadFiles(files);
        }}
      />
    </div>
  );
};
