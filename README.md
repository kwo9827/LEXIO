# 🎮 렉시오(Lexio) - 실시간 웹 보드게임

> 렉시오는 오프라인 보드게임 ‘Lexio’를 웹 환경에서 실시간으로 즐길 수 있도록 구현한 온라인 보드게임 서비스입니다. Firebase 실시간 데이터베이스를 활용하여 실시간 멀티플레이 게임을 제공하며, 모바일 최적화와 직관적인 UI를 통해 누구나 쉽게 플레이할 수 있습니다.

---

## ✅ 주요 기능

- 👥 **멀티플레이 실시간 게임방** (Firebase Realtime Database)
- 🀄 **렉시오 게임 규칙 기반 턴제 게임 로직**
- ✋ **패스, 제출, 족보 유효성 검사, 턴 타이머**
- 🧠 **AI 추천 조합 기능**
- 🧾 **라운드 및 게임 종료 시 정산 결과 표시**
- 📱 **모바일 퍼스트 UI/UX 설계**
- 🔒 **방 생성/입장 및 유저 관리 기능**

---

## 🖼️ 데모

> 📸
![렉시오2](https://github.com/user-attachments/assets/7bcc32e9-1974-42d1-9a91-02f6fa990b6d)
![렉시오3](https://github.com/user-attachments/assets/bbc7b13b-fad2-46c7-93d3-5da6ba003600)
![렉시오4](https://github.com/user-attachments/assets/47eb7c24-79d7-451c-b88d-155cfd5c6dad)
![렉시오5](https://github.com/user-attachments/assets/cb9420ae-3235-4658-a74a-3320d62072af)
![렉시오6](https://github.com/user-attachments/assets/1b393ce1-05cf-4287-b539-1273e23c6db0)
![렉시오7](https://github.com/user-attachments/assets/9b290ec5-30ee-4bef-95e7-7849712bfdd5)
![렉시오8](https://github.com/user-attachments/assets/f687111e-a69b-4898-ad0c-e6e0b4d8aaa3)
![렉시오9](https://github.com/user-attachments/assets/54835735-1dcb-4fff-a653-df24aaf4a68d)
![렉시오10](https://github.com/user-attachments/assets/035dc617-731c-4932-9b25-be003e2ea7a6)


---

## 🔧 기술 스택

| 영역        | 기술                                               |
|-------------|----------------------------------------------------|
| Frontend    | React, TypeScript, TailwindCSS                     |
| Backend     | Firebase Realtime Database                         |
| State Mgmt  | Zustand, React Query                               |
| Animation   | Framer Motion, Tailwind Transition                 |
| Deployment  | Vercel                                              |

---

## 🧠 주요 기술 포인트 및 트러블슈팅

### 1. 실시간 동기화
- Firebase의 `onValue`를 통해 게임 상태(턴, 제출, 타일, 패스 등)를 모두 클라이언트에 실시간 반영
- turn 변경 시 타이머 초기화, 게임 상태에 따라 버튼 비활성화

### 2. 패스/제출에 따른 라운드 종료 처리
- 유저가 패스를 한 경우 `passPlayers`에 저장
- 해당 라운드에서 제출자가 1명만 남거나, 모든 유저가 패스 시 `subRoundEnded` 값으로 턴 리셋

### 3. 족보 유효성 검사 및 추천 로직
- `validateTiles()` 함수로 족보 판단
- `compareCombo()`를 통해 이전 족보와 비교
- `recommendTiles()`로 현재 손패 기준 추천 조합 제공

### 4. UI/UX 최적화
- **모바일 기준 반응형 레이아웃**
- 상대 패 카드 뒷면 시각화
- 내가 낸 타일만큼 줄어드는 손패 표시
- 모달로 정산 결과 및 라운드 종료 알림 표시

---

## 🔁 게임 흐름 요약

1. 사용자가 방을 생성하고 입장
2. 호스트가 게임 시작 시 자동으로 타일 분배 및 `cloud3` 소유자 선
3. 각 플레이어는 턴마다 타일 제출 또는 패스
4. 패스 로직에 따라 라운드가 종료되고 정산 수행
5. 한 유저의 칩이 0개가 되면 게임 종료 및 결과 화면 전환

---

## 🔐 게임 규칙 간략 요약

- 족보 비교는 다음 순서로 판단
  - 싱글(숫자 > 문양), 페어, 트리플, 스트레이트, 플러시, 풀하우스, 포카드, 스트레이트 플러시
- 족보가 다르더라도 5장 족보끼리는 비교 가능
- 한 라운드에서 한 번 패스한 유저는 그 라운드 동안 다시 낼 수 없음
- 턴 타이머는 15초이며 자동 패스 처리됨

---

## 🚀 실행 방법

```bash
git clone https://github.com/kwo9827/LEXIO.git
cd lexio-mobile
npm install
npm run dev
```
