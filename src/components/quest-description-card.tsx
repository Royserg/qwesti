import ChevronDown from "icons/chevron-down";
import { type Component, Show, createEffect, createMemo, createResource, createSignal } from "solid-js";
import { updateQuestDescription, uploadDescriptionAsset } from "~/actions";
import type { QuestDescriptionAsset } from "~/bindings";
import {
  countDescriptionAssetReferences,
  extractDescriptionPreviewText,
  extractDescriptionText,
  renderDescriptionMarkdown,
  resolveDescriptionAssetMap,
  startsDescriptionWithImage,
} from "~/lib/quest-description";
import { cn } from "~/lib/utils";
import { QuestDescriptionEditor } from "./quest-description-editor";
import { Button } from "./ui/button";

interface Props {
  questId: string;
  description: string | null;
  assets: QuestDescriptionAsset[];
  onSaved: () => Promise<void>;
}

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "video",
  "audio",
  "summary",
].join(",");

export const QuestDescriptionCard: Component<Props> = (props) => {
  const [expanded, setExpanded] = createSignal(false);
  const [editing, setEditing] = createSignal(false);
  const [draftDescription, setDraftDescription] = createSignal(props.description ?? "");
  const [draftAssets, setDraftAssets] = createSignal(props.assets);
  const [uploadedAssetIds, setUploadedAssetIds] = createSignal<string[]>([]);
  const [isSaving, setIsSaving] = createSignal(false);
  const [assetMap] = createResource(
    () => props.assets.map((asset) => `${asset.id}:${asset.relativePath}:${asset.mimeType}:${asset.originalFilename ?? ""}`).join("|"),
    () => resolveDescriptionAssetMap(props.assets),
  );

  const hasDescription = createMemo(() => Boolean(props.description?.trim()));
  const isCompactEmptyState = createMemo(() => !editing() && !hasDescription());
  const startsWithImage = createMemo(() => startsDescriptionWithImage(props.description ?? ""));
  const previewText = createMemo(() => extractDescriptionPreviewText(props.description ?? ""));
  const descriptionText = createMemo(() => extractDescriptionText(props.description ?? ""));
  const assetCount = createMemo(() => countDescriptionAssetReferences(props.description ?? ""));
  const hasMultiplePreviewLines = createMemo(
    () => previewText().split("\n").filter((line) => line.trim().length > 0).length > 1,
  );
  const canExpand = createMemo(
    () => hasMultiplePreviewLines() || descriptionText().length > 80 || assetCount() > 0,
  );
  const previewHtml = createMemo(() => renderDescriptionMarkdown(props.description ?? "", assetMap() ?? {}));
  const collapsedSummary = createMemo(() => {
    if (previewText()) {
      return previewText();
    }

    if (assetCount() > 0) {
      return `${assetCount()} ${assetCount() === 1 ? "file" : "files"} attached.`;
    }

    return "click to add a description";
  });

  createEffect(() => {
    if (editing()) {
      return;
    }

    setDraftDescription(props.description ?? "");
    setDraftAssets(props.assets);
    setUploadedAssetIds([]);

    if (!props.description?.trim()) {
      setExpanded(false);
    }
  });

  const handleUploadFile = async (file: File) => {
    try {
      const asset = await uploadDescriptionAsset({
        questId: props.questId,
        file,
      });
      setDraftAssets((current) => [...current, asset]);
      setUploadedAssetIds((current) => [...current, asset.id]);
      return asset;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const saveDescription = async (value: string) => {
    setIsSaving(true);

    try {
      await updateQuestDescription({
        questId: props.questId,
        description: value,
      });
      await props.onSaved();
      setEditing(false);
      setExpanded(false);
      setUploadedAssetIds([]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (uploadedAssetIds().length > 0) {
      await saveDescription(props.description ?? "");
      return;
    }

    setDraftDescription(props.description ?? "");
    setDraftAssets(props.assets);
    setEditing(false);
  };

  const enterEditMode = () => {
    if (editing()) {
      return;
    }

    setDraftDescription(props.description ?? "");
    setDraftAssets(props.assets);
    setEditing(true);
  };

  const handleReadSurfaceClick = (event: MouseEvent) => {
    if (editing()) {
      return;
    }

    const targetNode = event.target;
    const targetElement = targetNode instanceof Element
      ? targetNode
      : targetNode instanceof Node
        ? targetNode.parentElement
        : null;

    if (targetElement?.closest(INTERACTIVE_SELECTOR)) {
      return;
    }

    enterEditMode();
  };

  const handleReadSurfaceKeyDown = (event: KeyboardEvent) => {
    if (editing() || event.currentTarget !== event.target) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      enterEditMode();
    }
  };

  return (
    <div class="mt-3">
      <div
        class={cn(
          "pixel-description-surface flex flex-col gap-2.5",
          !isCompactEmptyState() && "min-h-[120px]",
          editing() ? "pixel-description-surface--editing" : "pixel-description-surface--interactive",
          isCompactEmptyState() && "pixel-description-surface--compact",
        )}
        role={editing() ? undefined : "button"}
        tabIndex={editing() ? -1 : 0}
        onClick={handleReadSurfaceClick}
        onKeyDown={handleReadSurfaceKeyDown}
      >
        <Show
          when={editing()}
          fallback={
            <>
              <Show when={isCompactEmptyState()}>
                <button
                  type="button"
                  class="pixel-description-empty-trigger type-copy text-sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    enterEditMode();
                  }}
                >
                  click to add a description
                </button>
              </Show>

              <Show
                when={!isCompactEmptyState() && expanded() && hasDescription()}
                fallback={
                  <Show when={!isCompactEmptyState()}>
                    <div class="flex flex-col gap-2">
                      <Show
                        when={hasDescription() && startsWithImage()}
                        fallback={<p class="pixel-description-excerpt type-copy text-sm leading-relaxed">{collapsedSummary()}</p>}
                      >
                        <div class="pixel-description-preview-snippet">
                          <div class="pixel-markdown" innerHTML={previewHtml()} />
                        </div>
                      </Show>

                      <Show when={hasDescription() && assetCount() > 0 && !previewText()}>
                        <span class="type-copy text-[0.76rem] text-[var(--muted-color)]">
                          {assetCount()} {assetCount() === 1 ? "file" : "files"} attached
                        </span>
                      </Show>
                    </div>
                  </Show>
                }
              >
                <div class="pixel-markdown" innerHTML={previewHtml()} />
              </Show>

              <Show when={!isCompactEmptyState() && hasDescription() && canExpand()}>
                <div
                  class="mt-auto flex justify-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    class="pixel-description-toggle"
                    aria-label={expanded() ? "Show less description" : "Show more description"}
                    onKeyDown={(event) => event.stopPropagation()}
                    onClick={() => setExpanded((value) => !value)}
                  >
                    <span>{expanded() ? "less" : "more"}</span>
                    <ChevronDown
                      class={expanded() ? "size-3 rotate-180 transition-transform" : "size-3 transition-transform"}
                    />
                  </button>
                </div>
              </Show>
            </>
          }
        >
          <>
            <QuestDescriptionEditor
              compact
              value={draftDescription()}
              assets={draftAssets()}
              onChange={setDraftDescription}
              onUploadFile={handleUploadFile}
            />

            <div class="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSaving()}
                onClick={() => {
                  void handleCancel();
                }}
              >
                cancel
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isSaving()}
                onClick={() => {
                  void saveDescription(draftDescription());
                }}
              >
                {isSaving() ? "saving..." : "save description"}
              </Button>
            </div>
          </>
        </Show>
      </div>
    </div>
  );
};
