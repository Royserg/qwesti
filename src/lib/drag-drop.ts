import { PointerActivationConstraints, PointerSensor, type Sensors } from "@dnd-kit/dom";

export const ROOT_PARENT_ID = "__root__";
export const DRAG_MOUSE_DISTANCE_PX = 4;
export const DRAG_TOUCH_DELAY_MS = 220;
export const DRAG_TOUCH_TOLERANCE_PX = 8;
export const TREE_AUTO_EXPAND_DELAY_MS = 300;
export const DRAG_CLICK_SUPPRESS_MS = 250;
export const SORTABLE_ITEM_TRANSITION = {
  duration: 220,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  idle: true,
} as const;
export const DRAG_DROP_OVERLAY_ANIMATION = {
  duration: 240,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export interface TaskDragSnapshot {
  title: string;
  completed: boolean;
  progress?: number;
}

export interface TreeItemDragData {
  kind: "tree-item";
  questId: string;
  parentId: string | null;
  index: number;
  childCount: number;
  hasChildren: boolean;
  descendantIds: string[];
  snapshot: TaskDragSnapshot;
}

export interface TreeInsertDropData {
  kind: "tree-insert";
  parentId: string | null;
  index: number;
}

export interface TreeIntoDropData {
  kind: "tree-into";
  questId: string;
  childCount: number;
  hasChildren: boolean;
}

export interface FlatItemDragData {
  kind: "flat-item";
  questId: string;
  index: number;
  snapshot: TaskDragSnapshot;
}

export interface FlatInsertDropData {
  kind: "flat-insert";
  index: number;
}

export type DragData =
  | TreeItemDragData
  | TreeInsertDropData
  | TreeIntoDropData
  | FlatItemDragData
  | FlatInsertDropData;

export const dragSensors: Sensors = [
  PointerSensor.configure({
    activationConstraints: (event) => (
      event.pointerType === "touch"
        ? [new PointerActivationConstraints.Delay({
          value: DRAG_TOUCH_DELAY_MS,
          tolerance: DRAG_TOUCH_TOLERANCE_PX,
        })]
        : [new PointerActivationConstraints.Distance({ value: DRAG_MOUSE_DISTANCE_PX })]
    ),
  }),
];

export const isTreeItemDragData = (data: unknown): data is TreeItemDragData =>
  typeof data === "object" && data !== null && "kind" in data && data.kind === "tree-item";

export const isTreeInsertDropData = (data: unknown): data is TreeInsertDropData =>
  typeof data === "object" && data !== null && "kind" in data && data.kind === "tree-insert";

export const isTreeIntoDropData = (data: unknown): data is TreeIntoDropData =>
  typeof data === "object" && data !== null && "kind" in data && data.kind === "tree-into";

export const isFlatItemDragData = (data: unknown): data is FlatItemDragData =>
  typeof data === "object" && data !== null && "kind" in data && data.kind === "flat-item";

export const isFlatInsertDropData = (data: unknown): data is FlatInsertDropData =>
  typeof data === "object" && data !== null && "kind" in data && data.kind === "flat-insert";

export const moveItemToIndex = <T extends { id: string }>(
  items: T[],
  itemId: string,
  rawIndex: number,
): T[] | null => {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  if (currentIndex < 0 || rawIndex < 0) {
    return null;
  }

  const adjustedIndex = rawIndex > currentIndex ? rawIndex - 1 : rawIndex;
  const targetIndex = Math.max(0, Math.min(adjustedIndex, items.length - 1));
  if (targetIndex === currentIndex) {
    return null;
  }

  const nextItems = [...items];
  const [removed] = nextItems.splice(currentIndex, 1);
  if (!removed) {
    return null;
  }

  nextItems.splice(targetIndex, 0, removed);
  return nextItems;
};

export const serializeParentId = (parentId: string | null) => parentId ?? ROOT_PARENT_ID;
