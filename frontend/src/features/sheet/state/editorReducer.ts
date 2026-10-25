import type { SheetBlock, SheetDraft } from "../types";

/** What the editor holds while a character is built or changed. */
export type EditorState = {
  draft: SheetDraft;
  /** The last block removed, for Undo (design 03.10). */
  removed: { block: SheetBlock; index: number } | null;
};

export type EditorAction =
  | { type: "load"; draft: SheetDraft }
  | { type: "rename"; name: string }
  | { type: "add"; block: SheetBlock }
  | { type: "change"; block: SheetBlock }
  | { type: "replaceAll"; blocks: SheetBlock[] }
  | { type: "togglePin"; id: string }
  | { type: "move"; from: number; to: number }
  | { type: "remove"; id: string }
  | { type: "undoRemove" }
  | { type: "forgetRemoved" };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { draft } = state;
  switch (action.type) {
    case "load":
      return { draft: action.draft, removed: null };
    case "rename":
      return { ...state, draft: { ...draft, name: action.name } };
    case "add":
      return { ...state, draft: { ...draft, blocks: [...draft.blocks, action.block] } };
    case "change":
      return {
        ...state,
        draft: { ...draft, blocks: draft.blocks.map((b) => (b.id === action.block.id ? action.block : b)) },
      };
    case "replaceAll":
      return { ...state, draft: { ...draft, blocks: action.blocks } };
    case "togglePin":
      return {
        ...state,
        draft: { ...draft, blocks: draft.blocks.map((b) => (b.id === action.id ? { ...b, pinned: !b.pinned } : b)) },
      };
    case "move": {
      const { from, to } = action;
      if (from === to || to < 0 || to >= draft.blocks.length) return state;
      const blocks = draft.blocks.slice();
      const [moved] = blocks.splice(from, 1);
      blocks.splice(to, 0, moved);
      return { ...state, draft: { ...draft, blocks } };
    }
    case "remove": {
      const index = draft.blocks.findIndex((b) => b.id === action.id);
      if (index < 0) return state;
      return {
        draft: { ...draft, blocks: draft.blocks.filter((b) => b.id !== action.id) },
        removed: { block: draft.blocks[index], index },
      };
    }
    case "undoRemove": {
      if (!state.removed) return state;
      const blocks = draft.blocks.slice();
      blocks.splice(Math.min(state.removed.index, blocks.length), 0, state.removed.block);
      return { draft: { ...draft, blocks }, removed: null };
    }
    case "forgetRemoved":
      return { ...state, removed: null };
  }
}
