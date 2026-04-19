# Deal-Karo-Frontend

![React Native](https://img.shields.io/badge/React_Native-0.74-20232A?logo=react&logoColor=61DAFB&style=flat-square)
![Expo](https://img.shields.io/badge/Expo-51-000020?logo=expo&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)
![App Store](https://img.shields.io/badge/App_Store-Available-0D96F6?logo=appstore&logoColor=white&style=flat-square)
![Play Store](https://img.shields.io/badge/Play_Store-Available-3DDC84?logo=googleplay&logoColor=white&style=flat-square)

React Native mobile application for the Deal Krein platform. Shares a backend API with the web application and extends it with real-time messaging, push notifications, and native device features.

**App Store:** [Link](your-appstore-link) &nbsp;|&nbsp; **Play Store:** [Link](your-playstore-link) &nbsp;|&nbsp; **Backend:** [Deal-Karo-Backend](https://github.com/arham213/Deal-Karo-Backend) &nbsp;|&nbsp; **Web:** [Deal-Karo-Web](https://github.com/arham213/deal-karo-web)

---

<!-- Add a screenshot or GIF of the app here -->
<!-- ![App Preview](./docs/screenshot.png) -->

## System Overview

```
Deal Krein
├── deal-kroo              # Next.js web application
├── Deal-Karo-Frontend     # React Native mobile application (this repo)
└── Deal-Karo-Backend      # Shared Node.js REST API
```

---

## Features

- OTP-based authentication and multi-step user onboarding
- Property listings with search, filtering, and pagination
- Supports plots, houses, and commercial deals (cash and installment)
- Real-time messaging via Socket.IO — typing indicators, read/unread state, online presence
- In-chat image sharing and voice messages
- Push notifications, haptic feedback, and secure local storage
- Direct calls between users
- Property notes, profile management, and account deletion

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native, Expo, TypeScript |
| Real-time | Socket.IO Client |
| Storage | Expo SecureStore |
| Notifications | Expo Push Notifications |
| API | REST — shared with web via Deal-Karo-Backend |
| Distribution | App Store, Play Store |

---

## Local Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- [Deal-Karo-Backend](https://github.com/arham213/Deal-Karo-Backend) running locally or remotely *(required — must be running before starting the app)*

```bash
git clone https://github.com/arham213/Deal-Karo-Frontend.git
cd Deal-Karo-Frontend
npm install
```

```bash
npx expo start
```

See the [backend README](https://github.com/arham213/Deal-Karo-Backend#readme) for full backend setup instructions.

---

## Author

[LinkedIn](https://linkedin.com/in/arhamasjid) · arhamasjid213@gmail.com
