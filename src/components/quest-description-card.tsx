import ChevronDown from "icons/chevron-down";
import { type Component, createEffect, createMemo, createResource, createSignal, Match, Show, Switch } from "solid-js";
import { updateQuestDescription, uploadDescriptionImage } from "~/actions";
import type { QuestDescriptionAsset } from "~/bindings";
import {
  countDescriptionImageReferences,
  extractDescriptionPreviewText,
  extractDescriptionText,
  renderDescriptionMarkdown,
  resolveDescriptionAssetUrls,
  startsDescriptionWithImage,
} from "~/lib/quest-description";
import { QuestDescriptionEditor } from "./quest-description-editor";
import { Button } from "./ui/button";

interface Props {
  questId: string;
  description: string | null;
  assets: QuestDescriptionAsset[];
  onSaved: () => Promise<void>;
}

export const QuestDescriptionCard: Component<Props> = (props) => {
  const [expanded, setExpanded] = createSignal(false);
  const [editing, setEditing] = createSignal(false);
  const [draftDescription, setDraftDescription] = createSignal(props.description ?? "");
  const [draftAssets, setDraftAssets] = createSignal(props.assets);
  const [uploadedAssetIds, setUploadedAssetIds] = createSignal<string[]>([]);
  const [isSaving, setIsSaving] = createSignal(false);
  const [assetUrls] = createResource(
    () => props.assets.map((asset) => `${asset.id}:${asset.relativePath}`).join("|"),
    () => resolveDescriptionAssetUrls(props.assets),
  );

  const hasDescription = createMemo(() => Boolean(props.description?.trim()));
  const startsWithImage = createMemo(() => startsDescriptionWithImage(props.description ?? ""));
  const previewText = createMemo(() => extractDescriptionPreviewText(props.description ?? ""));
  const descriptionText = createMemo(() => extractDescriptionText(props.description ?? ""));
  const imageCount = createMemo(() => countDescriptionImageReferences(props.description ?? ""));
  const hasMultiplePreviewLines = createMemo(
    () => previewText().split("\n").filter((line) => line.trim().length > 0).length > 1,
  );
  const canExpand = createMemo(
    () => hasMultiplePreviewLines() || descriptionText().length > 80 || imageCount() > 0,
  );
  const previewHtml = createMemo(() => renderDescriptionMarkdown(props.description ?? "", assetUrls() ?? {}));
  const collapsedSummary = createMemo(() => {
    if (previewText()) {
      return previewText();
    }

    if (imageCount() > 0) {
      return `${imageCount()} ${imageCount() === 1 ? "image" : "images"} attached.`;
    }

    return "click to add a description";
  });

  createEffect(() => {
    setDraftDescription(props.description ?? "");
    setDraftAssets(props.assets);
    setUploadedAssetIds([]);

    if (!props.description?.trim()) {
      setExpanded(false);
    }
  });

  const handleUploadImage = async (file: File) => {
    try {
      const asset = await uploadDescriptionImage({
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
    setDraftDescription(props.description ?? "");
    setDraftAssets(props.assets);
    setEditing(true);
  };

  return (
    <div class="mt-3">
      <Switch>
        <Match when={editing()}>
          <div class="pixel-description-surface pixel-description-surface--editing flex flex-col gap-3">
            <QuestDescriptionEditor
              compact
              value={draftDescription()}
              assets={draftAssets()}
              onChange={setDraftDescription}
              onUploadImage={handleUploadImage}
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
          </div>
        </Match>

        <Match when={!editing()}>
          <div
            class="pixel-description-surface pixel-description-surface--interactive flex flex-col gap-2.5"
            role="button"
            tabIndex={0}
            onClick={enterEditMode}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                enterEditMode();
              }
            }}
          >
            <Show
              when={expanded() && hasDescription()}
              fallback={
                <div class="flex flex-col gap-2">
                  <Show
                    when={hasDescription() && startsWithImage()}
                    fallback={
                      <p
                        class="pixel-description-excerpt type-copy text-sm leading-relaxed"
                        classList={{
                          "text-[var(--muted-color)]": !hasDescription(),
                        }}
                      >
                        {collapsedSummary()}
                      </p>
                    }
                  >
                    <div class="pixel-description-preview-snippet">
                      <div class="pixel-markdown" innerHTML={previewHtml()} />
                    </div>
                  </Show>

                  <Show when={hasDescription() && imageCount() > 0 && !previewText()}>
                    <span class="type-copy text-[0.76rem] text-[var(--muted-color)]">
                      {imageCount()} {imageCount() === 1 ? "image" : "images"} attached
                    </span>
                  </Show>
                </div>
              }
            >
              <div class="pixel-markdown" innerHTML={previewHtml()} />
            </Show>

            <Show when={hasDescription() && canExpand()}>
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
          </div>
        </Match>
      </Switch>
    </div>
  );
};
