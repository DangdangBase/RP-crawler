# RP-crawling

## 설명

로켓펀치에 등록되어있는 기업목록을 크롤링해오는 프로그램입니다.

## 사용법

- 반복적인 API call로 IP가 block될 수 있으니, 프로그램 실행 전 VPN을 키도록 합니다
- 로그인 후, 개발자도구 - 네트워크 - 쏜 API의 요청헤더에서 cookie의 value를 복사하여 `CRAWLER_COOKIE` 항목으로 터미널 노드 변수에 등록합니다.
  - 예시: `$ export CRAWLER_COOKIE=yout_cookie_value`
- `npm start`로 프로그램을 실행합니다

## TODO

- proxy 적용
- 자동 로그인 로직 추가
- axios proxy 설정
- electron 앱 생성
