복지나침반 v0.9 — 설치 UX 개선

변경: 지원 브라우저가 beforeinstallprompt를 전달할 때 ‘무료로 앱 설치하기’ 버튼이 활성화되고, 누르면 실제 브라우저 설치 확인창이 열리도록 개선. 아직 설치 이벤트가 오지 않은 경우 ‘앱 설치 방법 보기’로 표시하고 기기별 수동 설치 방법을 안내. 설치 완료 후 버튼 숨김.

배포: ZIP 압축 해제 후 index.html 파일만 GitHub bokji-compass/public/index.html 에 교체 업로드. 기존 public/data, icons, manifest.webmanifest, service-worker.js 삭제 금지.

주의: 안드로이드 Chrome 등에서 설치 가능하다는 브라우저 판단이 선행돼야 시스템 설치창을 띄울 수 있음. 네이버 앱 내부 브라우저 및 iOS는 버튼으로 네이티브 설치창을 강제할 수 없음.

테스트: 배포 성공 후 Chrome(안드로이드)으로 사이트를 직접 열고 설치 버튼 문구가 바뀌는지 확인. 실제 기기 통합 테스트는 별도 필요.
