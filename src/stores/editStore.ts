import { create } from 'zustand';

interface EditState {
  /** 当前是否处于编辑模式 */
  isEditing: boolean;
  /** 当前是否有未保存的修改 */
  isDirty: boolean;
  /** 最后保存的时间戳（用于通知 file watcher 跳过） */
  lastSaveAt: number;
  toggleEditing: () => void;
  setDirty: (dirty: boolean) => void;
  markSaved: () => void;
  reset: () => void;
}

export const useEditStore = create<EditState>((set, get) => ({
  isEditing: false,
  isDirty: false,
  lastSaveAt: 0,

  toggleEditing() {
    const { isEditing, isDirty } = get();
    // 从编辑切回预览时，如果有未保存修改，提示用户
    if (isEditing && isDirty) {
      // 调用方可以通过外部确认后再调用
    }
    set({ isEditing: !isEditing, isDirty: false });
  },

  setDirty(dirty) {
    set({ isDirty: dirty });
  },

  markSaved() {
    set({ isDirty: false, lastSaveAt: Date.now() });
  },

  reset() {
    set({ isEditing: false, isDirty: false });
  },
}));
