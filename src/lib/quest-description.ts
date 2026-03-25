import { convertFileSrc } from "@tauri-apps/api/core";
import { appConfigDir, join } from "@tauri-apps/api/path";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { QuestDescriptionAsset } from "~/bindings";

export const DESCRIPTION_ASSET_DIR = "quest-description-assets";
export const DESCRIPTION_ASSET_SCHEME = "qwesti-asset://";

export interface ResolvedDescriptionAsset {
  url: string;
  mimeType: string;
  filename: string | null;
}

let appConfigDirPromise: Promise<string> | null = null;

const DESCRIPTION_SENTENCE_PATTERN = /[^.!?]+(?:[.!?]+(?=\s|$)|$)/g;

const descriptionSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "video"],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel", "data-description-file-link"],
    video: ["src", "controls", "preload"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? []), "asset"],
    href: [...(defaultSchema.protocols?.href ?? []), "asset"],
  },
};

const getAppConfigDir = () => {
  if (!appConfigDirPromise) {
    appConfigDirPromise = appConfigDir();
  }

  return appConfigDirPromise;
};

const normalizeAltText = (value: string) =>
  value
    .replace(/\.[^.]+$/, "")
    .replace(/[\[\]]/g, "")
    .trim() || "file";

const normalizeLinkText = (value: string) =>
  value
    .replace(/[\[\]]/g, "")
    .trim() || "file";

const escapeMarkdownLabel = (value: string) => value.replace(/([\[\]])/g, "\\$1");

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isImageMime = (mimeType: string) => mimeType.startsWith("image/");

const isVideoMime = (mimeType: string) => mimeType.startsWith("video/");

const getDescriptionAssetId = (destination: string) =>
  destination.startsWith(DESCRIPTION_ASSET_SCHEME)
    ? destination.slice(DESCRIPTION_ASSET_SCHEME.length)
    : null;

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

const readStringProperty = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string").join(" ");
  }

  return "";
};

const extractNodeText = (node: HastNode): string => {
  if (node.type === "text") {
    return node.value ?? "";
  }

  if (!node.children || node.children.length === 0) {
    return "";
  }

  return node.children.map(extractNodeText).join("");
};

const createTextNode = (value: string): HastNode => ({
  type: "text",
  value,
});

const createFileLinkNode = (asset: ResolvedDescriptionAsset, label: string): HastNode => ({
  type: "element",
  tagName: "a",
  properties: {
    href: asset.url,
    target: "_blank",
    rel: "noopener noreferrer",
    "data-description-file-link": "true",
  },
  children: [createTextNode(label)],
});

const rewriteDescriptionAssetNodes = (
  tree: HastNode,
  assetMap: Record<string, ResolvedDescriptionAsset>,
) => {
  const visitNode = (node: HastNode, parent?: HastNode, index?: number) => {
    if (node.type === "element") {
      if (node.tagName === "img") {
        const src = readStringProperty(node.properties?.src);
        const assetId = getDescriptionAssetId(src);

        if (assetId) {
          const asset = assetMap[assetId];
          const fallbackLabel = normalizeLinkText(
            readStringProperty(node.properties?.alt) || "file",
          );

          if (!asset) {
            if (parent && typeof index === "number" && parent.children) {
              parent.children[index] = createTextNode(fallbackLabel);
            }
            return;
          }

          if (isVideoMime(asset.mimeType)) {
            if (parent && typeof index === "number" && parent.children) {
              parent.children[index] = {
                type: "element",
                tagName: "video",
                properties: {
                  src: asset.url,
                  controls: true,
                  preload: "metadata",
                },
                children: [],
              };
            }
            return;
          }

          if (isImageMime(asset.mimeType)) {
            node.properties = {
              ...node.properties,
              src: asset.url,
            };
            return;
          }

          if (parent && typeof index === "number" && parent.children) {
            const fileLabel = normalizeLinkText(asset.filename ?? fallbackLabel);
            parent.children[index] = createFileLinkNode(asset, fileLabel);
          }
          return;
        }
      }

      if (node.tagName === "a") {
        const href = readStringProperty(node.properties?.href);
        const assetId = getDescriptionAssetId(href);

        if (assetId) {
          const asset = assetMap[assetId];
          const linkLabel = normalizeLinkText(extractNodeText(node));

          if (!asset) {
            if (parent && typeof index === "number" && parent.children) {
              parent.children[index] = createTextNode(linkLabel || "file");
            }
            return;
          }

          node.properties = {
            ...node.properties,
            href: asset.url,
            target: "_blank",
            rel: "noopener noreferrer",
            "data-description-file-link": "true",
          };

          if (!linkLabel) {
            node.children = [createTextNode(normalizeLinkText(asset.filename ?? "file"))];
          }
        }
      }
    }

    if (!node.children || node.children.length === 0) {
      return;
    }

    node.children.forEach((child, childIndex) => visitNode(child, node, childIndex));
  };

  visitNode(tree);
};

export const createDescriptionDraftId = () => {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createDescriptionAssetReferenceMarkdown = (
  asset: QuestDescriptionAsset,
  label?: string,
) => {
  const destination = `${DESCRIPTION_ASSET_SCHEME}${asset.id}`;

  if (isImageMime(asset.mimeType) || isVideoMime(asset.mimeType)) {
    const altText = normalizeAltText(label ?? asset.originalFilename ?? "file");
    return `![${escapeMarkdownLabel(altText)}](${destination})`;
  }

  const linkText = normalizeLinkText(label ?? asset.originalFilename ?? "file");
  return `[${escapeMarkdownLabel(linkText)}](${destination})`;
};

export const createDescriptionAssetMarkdown = (
  asset: QuestDescriptionAsset,
  label?: string,
) => createDescriptionAssetReferenceMarkdown(asset, label);

export const countDescriptionAssetReferences = (markdown: string) => {
  const escapedScheme = escapeRegExp(DESCRIPTION_ASSET_SCHEME);
  const matches = markdown.match(new RegExp(`${escapedScheme}[A-Za-z0-9-]+`, "g"));
  return matches?.length ?? 0;
};

export const countDescriptionImageReferences = (markdown: string) => countDescriptionAssetReferences(markdown);

export const startsDescriptionWithImage = (markdown: string) =>
  /^\s*!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/.test(markdown.trimStart());

export const extractDescriptionPreviewText = (markdown: string) =>
  markdown
    .replace(/\r\n?/g, "\n")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/^```.*$/gm, "")
    .replace(/[`*_~]/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const extractDescriptionText = (markdown: string) =>
  extractDescriptionPreviewText(markdown)
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const createDescriptionExcerpt = (markdown: string, maxLength = 220) => {
  const text = extractDescriptionText(markdown);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
};

export const createDescriptionSentenceExcerpt = (
  markdown: string,
  sentenceCount = 2,
) => {
  const text = extractDescriptionText(markdown);
  if (!text) {
    return "";
  }

  const sentences = text
    .match(DESCRIPTION_SENTENCE_PATTERN)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean);

  if (!sentences || sentences.length === 0) {
    return text;
  }

  return sentences.slice(0, sentenceCount).join(" ");
};

export const renderDescriptionMarkdown = (
  markdown: string,
  assetMap: Record<string, ResolvedDescriptionAsset>,
) => String(
  unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(() => (tree) => {
      rewriteDescriptionAssetNodes(tree as HastNode, assetMap);
    })
    .use(rehypeSanitize, descriptionSanitizeSchema)
    .use(rehypeStringify)
    .processSync(markdown),
);

export const resolveDescriptionAssetMap = async (
  assets: QuestDescriptionAsset[],
): Promise<Record<string, ResolvedDescriptionAsset>> => {
  const baseDir = await join(await getAppConfigDir(), DESCRIPTION_ASSET_DIR);

  const entries = await Promise.all(
    assets.map(async (asset) => {
      const segments = asset.relativePath.split("/").filter(Boolean);
      const absolutePath = await join(baseDir, ...segments);

      return [
        asset.id,
        {
          url: convertFileSrc(absolutePath),
          mimeType: asset.mimeType,
          filename: asset.originalFilename,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries);
};

export const resolveDescriptionAssetUrls = async (
  assets: QuestDescriptionAsset[],
): Promise<Record<string, string>> => {
  const assetMap = await resolveDescriptionAssetMap(assets);

  return Object.fromEntries(
    Object.entries(assetMap).map(([assetId, asset]) => [assetId, asset.url]),
  );
};
