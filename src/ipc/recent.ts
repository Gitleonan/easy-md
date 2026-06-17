import { invoke } from '@tauri-apps/api/core';
import type { RecentFile } from '../types';

export const listRecent = () => invoke<RecentFile[]>('list_recent');
export const addRecent = (f: RecentFile) => invoke('add_recent', { file: f });
