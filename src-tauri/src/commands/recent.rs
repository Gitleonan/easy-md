use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct RecentFile {
    pub path: String,
    pub name: String,
    pub last_opened_at: i64,
}

/// 获取 recent.json 的存储路径
fn recent_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = app.path().app_data_dir().expect("no app_data_dir");
    let _ = fs::create_dir_all(&dir);
    dir.join("recent.json")
}

/// 读取最近打开的文件列表
#[tauri::command]
pub async fn list_recent(app: tauri::AppHandle) -> Result<Vec<RecentFile>, String> {
    let p = recent_path(&app);
    if !p.exists() {
        return Ok(vec![]);
    }
    let s = fs::read_to_string(p).map_err(|e| e.to_string())?;
    serde_json::from_str(&s).map_err(|e| e.to_string())
}

/// 添加/更新最近打开的文件（去重，最多保留 20 条）
#[tauri::command]
pub async fn add_recent(app: tauri::AppHandle, file: RecentFile) -> Result<(), String> {
    let p = recent_path(&app);
    let mut list: Vec<RecentFile> = if p.exists() {
        serde_json::from_str(&fs::read_to_string(&p).unwrap_or_default()).unwrap_or_default()
    } else {
        vec![]
    };
    list.retain(|f| f.path != file.path);
    list.insert(0, file);
    list.truncate(20);
    fs::write(&p, serde_json::to_string_pretty(&list).unwrap()).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recent_file_serializes_correctly() {
        let f = RecentFile {
            path: "C:/test.md".to_string(),
            name: "test.md".to_string(),
            last_opened_at: 1234567890,
        };
        let json = serde_json::to_string(&f).unwrap();
        let decoded: RecentFile = serde_json::from_str(&json).unwrap();
        assert_eq!(decoded.path, "C:/test.md");
        assert_eq!(decoded.name, "test.md");
        assert_eq!(decoded.last_opened_at, 1234567890);
    }
}
