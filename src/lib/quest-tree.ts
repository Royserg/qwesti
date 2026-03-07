import type { Quest } from "~/bindings";

export interface TreeQuest extends Omit<Quest, "children" | "hasChildren"> {
  children: TreeQuest[];
  hasChildren: boolean;
  directCompleted: boolean;
}

interface RemoveResult {
  quests: TreeQuest[];
  removed: TreeQuest | null;
  parentId: string | null;
  index: number;
}

interface InsertResult {
  quests: TreeQuest[];
  inserted: boolean;
}

export interface TreeMoveResult {
  nextTree: TreeQuest[];
  sourceParentId: string | null;
  sourceIndex: number;
  targetParentId: string | null;
  targetIndex: number;
}

interface ReplaceChildrenResult {
  quests: TreeQuest[];
  replaced: boolean;
}

export const recomputeTreeQuest = (quest: TreeQuest): TreeQuest => {
  const children = quest.children.map(recomputeTreeQuest);
  const hasChildren = children.length > 0;
  const completed = hasChildren ? children.every((child) => child.completed) : quest.directCompleted;

  return {
    ...quest,
    children,
    hasChildren,
    completed,
  };
};

export const collectExpandableIds = (quests: TreeQuest[]): string[] =>
  quests.flatMap((quest) => {
    if (!quest.children.length) {
      return [];
    }

    return [quest.id, ...collectExpandableIds(quest.children)];
  });

export const moveTreeQuest = (
  quests: TreeQuest[],
  questId: string,
  targetParentId: string | null,
  rawIndex: number,
): TreeMoveResult | null => {
  if (rawIndex < 0 || questId === targetParentId) {
    return null;
  }

  if (targetParentId && isDescendantOf(quests, questId, targetParentId)) {
    return null;
  }

  const removal = removeQuest(quests, questId, null);
  if (!removal.removed) {
    return null;
  }

  const targetSiblings = targetParentId === null
    ? removal.quests
    : findQuestById(removal.quests, targetParentId)?.children;

  if (!targetSiblings) {
    return null;
  }

  const adjustedIndex = removal.parentId === targetParentId && rawIndex > removal.index
    ? rawIndex - 1
    : rawIndex;
  const targetIndex = Math.max(0, Math.min(adjustedIndex, targetSiblings.length));

  if (removal.parentId === targetParentId && targetIndex === removal.index) {
    return null;
  }

  const movedQuest: TreeQuest = {
    ...removal.removed,
    parentId: targetParentId,
  };
  const insertion = insertQuest(removal.quests, movedQuest, targetParentId, targetIndex);
  if (!insertion.inserted) {
    return null;
  }

  return {
    nextTree: insertion.quests.map(recomputeTreeQuest),
    sourceParentId: removal.parentId,
    sourceIndex: removal.index,
    targetParentId,
    targetIndex,
  };
};

export const findQuestById = (quests: TreeQuest[], questId: string): TreeQuest | undefined => {
  for (const quest of quests) {
    if (quest.id === questId) {
      return quest;
    }

    const childMatch = findQuestById(quest.children, questId);
    if (childMatch) {
      return childMatch;
    }
  }

  return undefined;
};

export const collectDescendantIds = (quest: TreeQuest): string[] =>
  quest.children.flatMap((child) => [child.id, ...collectDescendantIds(child)]);

export const replaceTreeChildren = (
  quests: TreeQuest[],
  parentId: string | null,
  nextChildren: TreeQuest[],
): TreeQuest[] => {
  const normalizedChildren = nextChildren.map((child) => normalizeParentIds(child, parentId));

  if (parentId === null) {
    return normalizedChildren.map(recomputeTreeQuest);
  }

  const result = replaceChildrenRecursive(quests, parentId, normalizedChildren);
  return result.quests.map(recomputeTreeQuest);
};

const isDescendantOf = (quests: TreeQuest[], ancestorId: string, targetId: string): boolean => {
  const ancestor = findQuestById(quests, ancestorId);
  if (!ancestor) {
    return false;
  }

  return questContainsId(ancestor.children, targetId);
};

const questContainsId = (quests: TreeQuest[], targetId: string): boolean =>
  quests.some((quest) => quest.id === targetId || questContainsId(quest.children, targetId));

const normalizeParentIds = (quest: TreeQuest, parentId: string | null): TreeQuest => ({
  ...quest,
  parentId,
  children: quest.children.map((child) => normalizeParentIds(child, quest.id)),
});

const replaceChildrenRecursive = (
  quests: TreeQuest[],
  parentId: string,
  nextChildren: TreeQuest[],
): ReplaceChildrenResult => {
  let replaced = false;

  const nextQuests = quests.map((quest) => {
    if (quest.id === parentId) {
      replaced = true;
      return {
        ...quest,
        children: nextChildren,
      };
    }

    const nestedResult = replaceChildrenRecursive(quest.children, parentId, nextChildren);
    if (!nestedResult.replaced) {
      return quest;
    }

    replaced = true;
    return {
      ...quest,
      children: nestedResult.quests,
    };
  });

  return {
    quests: nextQuests,
    replaced,
  };
};

const removeQuest = (
  quests: TreeQuest[],
  questId: string,
  parentId: string | null,
): RemoveResult => {
  const directIndex = quests.findIndex((quest) => quest.id === questId);
  if (directIndex >= 0) {
    return {
      quests: [...quests.slice(0, directIndex), ...quests.slice(directIndex + 1)],
      removed: quests[directIndex],
      parentId,
      index: directIndex,
    };
  }

  for (const quest of quests) {
    const nestedRemoval = removeQuest(quest.children, questId, quest.id);
    if (!nestedRemoval.removed) {
      continue;
    }

    return {
      quests: quests.map((currentQuest) =>
        currentQuest.id === quest.id
          ? {
            ...currentQuest,
            children: nestedRemoval.quests,
          }
          : currentQuest,
      ),
      removed: nestedRemoval.removed,
      parentId: nestedRemoval.parentId,
      index: nestedRemoval.index,
    };
  }

  return {
    quests,
    removed: null,
    parentId: null,
    index: -1,
  };
};

const insertQuest = (
  quests: TreeQuest[],
  quest: TreeQuest,
  targetParentId: string | null,
  index: number,
): InsertResult => {
  if (targetParentId === null) {
    const nextQuests = [...quests];
    nextQuests.splice(index, 0, quest);
    return {
      quests: nextQuests,
      inserted: true,
    };
  }

  let inserted = false;
  const nextQuests = quests.map((currentQuest) => {
    if (currentQuest.id === targetParentId) {
      const nextChildren = [...currentQuest.children];
      nextChildren.splice(index, 0, quest);
      inserted = true;

      return {
        ...currentQuest,
        children: nextChildren,
      };
    }

    const nestedInsertion = insertQuest(currentQuest.children, quest, targetParentId, index);
    if (!nestedInsertion.inserted) {
      return currentQuest;
    }

    inserted = true;
    return {
      ...currentQuest,
      children: nestedInsertion.quests,
    };
  });

  return {
    quests: nextQuests,
    inserted,
  };
};
