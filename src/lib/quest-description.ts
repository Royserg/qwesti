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

let appConfigDirPromise: Promise<string> | null = null;

const DESCRIPTION_SENTENCE_PATTERN = /[^.!?]+(?:[.!?]+(?=\s|$)|$)/g;
const descriptionSanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? []), "asset"],
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
    .trim() || "image";

const rewriteDescriptionImages = (
  markdown: string,
  assetUrls: Record<string, string>,
) =>
  markdown.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_match, altText: string, destination: string) => {
      if (!destination.startsWith(DESCRIPTION_ASSET_SCHEME)) {
        return altText.trim() || "image";
      }

      const assetId = destination.slice(DESCRIPTION_ASSET_SCHEME.length);
      const assetUrl = assetUrls[assetId];
      if (!assetUrl) {
        return altText.trim() || "image";
      }

      return `![${altText}](${assetUrl})`;
    },
  );

export const createDescriptionDraftId = () => {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createDescriptionAssetMarkdown = (
  asset: QuestDescriptionAsset,
  altText?: string,
) => `![${normalizeAltText(altText ?? asset.originalFilename ?? "image")}](${DESCRIPTION_ASSET_SCHEME}${asset.id})`;

export const countDescriptionImageReferences = (markdown: string) =>
  [...markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].filter(([, destination]) =>
    destination.startsWith(DESCRIPTION_ASSET_SCHEME),
  ).length;

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
  assetUrls: Record<string, string>,
) => {
  const rewrittenMarkdown = rewriteDescriptionImages(markdown, assetUrls);

  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSanitize, descriptionSanitizeSchema)
      .use(rehypeStringify)
      .processSync(rewrittenMarkdown),
  );
};

export const resolveDescriptionAssetUrls = async (assets: QuestDescriptionAsset[]) => {
  const baseDir = await join(await getAppConfigDir(), DESCRIPTION_ASSET_DIR);

  const entries = await Promise.all(
    assets.map(async (asset) => {
      const segments = asset.relativePath.split("/").filter(Boolean);
      const absolutePath = await join(baseDir, ...segments);
      return [asset.id, convertFileSrc(absolutePath)] as const;
    }),
  );

  return Object.fromEntries(entries);
};
