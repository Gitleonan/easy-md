use notify_debouncer_mini::{new_debouncer, DebouncedEvent};
use std::{path::PathBuf, sync::Mutex, time::Duration};
use tauri::{AppHandle, Emitter, Manager};

/// 全局 watcher 状态，保活防止被 drop
pub struct WatcherState {
    pub watcher: Mutex<Option<notify_debouncer_mini::Debouncer<notify::RecommendedWatcher>>>,
    pub watched_paths: Mutex<Vec<String>>,
}

impl WatcherState {
    pub fn new() -> Self {
        Self {
            watcher: Mutex::new(None),
            watched_paths: Mutex::new(Vec::new()),
        }
    }
}

/// 前端调用：设置要监听的文件路径列表（替换之前的列表）。
/// 防抖 300ms，避免编辑器频繁保存导致的连续刷新。
/// 传入空数组则停止所有监听。
#[tauri::command]
pub async fn watch_files(app: AppHandle, paths: Vec<String>) -> Result<(), String> {
    let app_handle = app.clone();
    let state = app.state::<WatcherState>();

    // 先释放旧的 watcher
    {
        let mut guard = state.watcher.lock().unwrap();
        *guard = None;
    }

    if paths.is_empty() {
        state.watched_paths.lock().unwrap().clear();
        return Ok(());
    }

    let mut debouncer = new_debouncer(
        Duration::from_millis(300),
        move |res: Result<Vec<DebouncedEvent>, _>| {
            if let Ok(events) = res {
                let changed: Vec<String> = events
                    .iter()
                    .filter_map(|e| e.path.to_str().map(|s| s.to_string()))
                    .collect();
                if !changed.is_empty() {
                    let _ = app_handle.emit("file-changed", &changed);
                }
            }
        },
    )
    .map_err(|e| e.to_string())?;

    let mut watched = Vec::new();
    for p in &paths {
        if debouncer
            .watcher()
            .watch(PathBuf::from(p).as_path(), notify::RecursiveMode::NonRecursive)
            .is_ok()
        {
            watched.push(p.clone());
        }
    }

    *state.watcher.lock().unwrap() = Some(debouncer);
    *state.watched_paths.lock().unwrap() = watched;
    Ok(())
}
