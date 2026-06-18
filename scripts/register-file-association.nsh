!macro NSIS_HOOK_POSTINSTALL
  ; 注册 .md 文件右键菜单"用 md++ 打开"
  WriteRegStr HKCU "Software\Classes\.md\shell\OpenWithMdpp" "" "用 md++ 打开"
  WriteRegStr HKCU "Software\Classes\.md\shell\OpenWithMdpp\command" "" '"$INSTDIR\md++.exe" "%1"'
  ; .markdown 同理
  WriteRegStr HKCU "Software\Classes\.markdown\shell\OpenWithMdpp" "" "用 md++ 打开"
  WriteRegStr HKCU "Software\Classes\.markdown\shell\OpenWithMdpp\command" "" '"$INSTDIR\md++.exe" "%1"'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; 卸载时清理注册表
  DeleteRegKey HKCU "Software\Classes\.md\shell\OpenWithMdpp"
  DeleteRegKey HKCU "Software\Classes\.markdown\shell\OpenWithMdpp"
!macroend
