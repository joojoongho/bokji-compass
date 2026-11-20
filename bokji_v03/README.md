# 복지나침반 v0.3 — 무료 호스팅 기반 제도 카탈로그

## 현재 정확한 상태
- **웹앱과 수집 파이프라인은 구현**됨. 정적 JSON 스냅샷을 브라우저에서 읽어 검색한다.
- **정부 API 실제 수집은 미실행**. 공공데이터포털에서 발급받은 인증키가 없어 동봉된 `public/data/catalog.json`에는 **가상 테스트 3건**만 들어 있다. 실제 복지제도인 것처럼 취급 금지.
- 전국 행정기관의 모든 복지사업이 커버되거나 자격판정이 정확하다는 뜻이 아니다.
- 월소득·자산값은 입력 UI만 있고 수급자격 평가에 사용하지 않는다. 잘못된 판정 방지.

## 로컬 실행 (Windows CMD)
```bat
cd bokji_v03
python -m http.server 8000 --directory public
```
브라우저에서 `http://localhost:8000` 열기. `file://`로 열면 JSON 요청이 차단될 수 있다.

## 실제 공공데이터 수집 설정
1. 공공데이터포털 https://www.data.go.kr/data/15113968/openapi.do 에서 '행정안전부 대한민국 공공서비스(혜택) 정보' 활용신청 및 인증키 확인.
2. API 인증키는 사용자 브라우저 HTML이나 공개 저장소에 넣지 말 것.
3. Windows CMD 예제:
```bat
set GOV24_API_KEY=발급받은_인증키
python scripts\sync.py
```
4. 정상 수집 시 `public/data/catalog.json`이 `official_snapshot`으로 바뀜. 실패하면 기존 파일 유지.
5. 로컬 서버를 새로고침해 실제 카탈로그 확인.

**API 기준:** `https://api.odcloud.kr/api/gov24/v3/serviceList` 경로, `page`, `perPage`, `returnType`, `serviceKey` 사용. 정부 API 문서가 제시하는 상대 경로 `/gov24/v3/serviceList`와 출력 필드를 매핑했으나 **실제 인증 요청을 수행하지 못했으므로 베이스 URL과 인증 방식은 첫 수집 시 반드시 확인해야 한다.** 인증 방식이 다르면 `scripts/sync.py`의 `BASE`와 쿼리를 수정해야 한다.

## 무료 배포 (Cloudflare Pages + GitHub)
1. GitHub 저장소에 **`bokji_v03` 안의 파일을 루트로** 업로드 (`public` 폴더와 `.github` 포함).
2. Cloudflare Pages에서 GitHub 저장소 연결. Framework preset: `None`, Build command: 빈 값, Build output directory: `public`.
3. GitHub Repository Settings > Secrets and variables > Actions에서 `GOV24_API_KEY` 등록.
4. Actions > `Update official benefits snapshot` > Run workflow로 수동 수집 점검. 이후 매주 화요일 오전 3:37(KST) 실행을 시도한다.
5. 갱신 JSON을 Git에 커밋하면 Cloudflare Pages가 자동 배포하도록 설정.

**주의:** 자동화는 GitHub 저장소에 워크플로를 등록하고 Secrets를 넣어야 시작된다. GitHub 예약 작업은 지연되거나 취소될 수 있고 비활성화될 수 있어 모니터링이 필요하다. 수집 실패 시 기존 스냅샷 유지. Git 저장소가 공개라면 API 키는 반드시 Secrets에만 저장할 것.

## 파일 구조
- `public/index.html`: 브라우저 UI. 입력값 외부 전송/저장 안 함
- `public/data/catalog.json`: 현재 **가상 테스트 항목**
- `scripts/sync.py`: API 페이징·중복 제거·검증·원자적 저장
- `tests/fixture.json`: 가상 API 응답, 테스트용
- `.github/workflows/catalog-sync.yml`: 주 1회 수집 시도 및 자동 커밋
- `PRD.md`: 제품 목표, 데이터/판정/개인정보 모델

## 운영 전 필수 검증
- API 인증 및 전체 페이지 수집, 갱신건 누락 테스트, 필드 타입·공백, 지원대상과 지역 데이터 품질
- 전국 공통 서비스가 지역 필터에서 누락되는 문제: 현 v0.3의 지역 검색은 단순 텍스트 검색이며 진정한 지역 적격성 판단이 아니다
- 기존 서비스의 폐지, 중복, 변경일, 신청마감, 데이터 지연 확인
- 제도별 법령 기반 판정 규칙/버전/테스트 케이스 검증
- 개인정보 처리방침, 웹 접근성, 보안 및 법률 검토
