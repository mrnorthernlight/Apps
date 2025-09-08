# FamBase - Complete WhatsApp Clone

A full-featured, production-ready WhatsApp clone built with modern web technologies, featuring end-to-end encryption, real-time messaging, voice/video calls, and multi-platform support.

## 🚀 Features

### Core Messaging
- **End-to-end encryption** using Signal Protocol
- **Real-time messaging** with delivery and read receipts
- **Group chats** with admin controls and member management
- **Media sharing** (images, videos, documents, voice notes)
- **Message reactions** and replies
- **Message editing** and deletion (time-limited)
- **Typing indicators** and online presence

### Communication
- **Voice & Video calls** using WebRTC
- **Status/Stories** with 24-hour expiry
- **Push notifications** (FCM/APNs + Web Push)
- **Contact synchronization**

### Security & Privacy
- **Signal Protocol** implementation for 1:1 chats
- **Sender Keys** for efficient group encryption
- **Device management** and key backup
- **User blocking** and spam detection
- **Disappearing messages**

### Multi-Platform
- **Web App** (Next.js + React)
- **Mobile App** (React Native + Expo)
- **Desktop App** (Electron - planned)
- **Progressive Web App** (PWA) support

## 🏗️ Architecture

```
fambase/
├── apps/
│   ├── web/         # Next.js web application
│   ├── mobile/      # React Native mobile app
│   ├── desktop/     # Electron desktop app (planned)
│   └── server/      # Supabase Edge Functions
├── packages/
│   ├── shared/      # Common utilities and types
│   ├── crypto/      # End-to-end encryption
│   ├── database/    # Database schema and migrations
│   └── ui/          # Shared UI components
└── docs/           # Documentation
```

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Mobile**: React Native, Expo
- **Backend**: Supabase (PostgreSQL, Realtime, Storage, Auth)
- **Encryption**: Signal Protocol, libsignal
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage (encrypted)
- **Calls**: WebRTC with STUN/TURN
- **State Management**: Zustand
- **Monorepo**: pnpm workspaces

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- Twilio account (for SMS OTP)
- TURN server (for WebRTC calls)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/fambase.git
cd fambase
pnpm install
```

### 2. Setup Supabase

1. Create a new Supabase project
2. Run the database schema:

```sql
-- Copy and run the schema from packages/database/schema.sql
```

3. Create a storage bucket named `media` with public access disabled
4. Set up Row Level Security policies

### 3. Environment Variables

Copy the example environment files and fill in your credentials:

```bash
# Web app
cp apps/web/.env.example apps/web/.env.local

# Mobile app  
cp apps/mobile/.env.example apps/mobile/.env
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `FCM_SERVER_KEY` (for push notifications)
- `TURN_SERVER_URL`, `TURN_USERNAME`, `TURN_PASSWORD`

### 4. Run Development Servers

```bash
# Run all apps
pnpm dev

# Or run individually
pnpm --filter @fambase/web dev      # Web app on :3000
pnpm --filter @fambase/mobile start # Mobile app
```

### 5. Build for Production

```bash
# Build all packages
pnpm build

# Build specific app
pnpm --filter @fambase/web build
```

## 📱 Mobile Development

### iOS Setup

```bash
cd apps/mobile
npx expo run:ios
```

### Android Setup

```bash
cd apps/mobile
npx expo run:android
```

### Expo Development Build

```bash
cd apps/mobile
npx expo install --fix
eas build --profile development --platform all
```

## 🔐 Security Implementation

### End-to-End Encryption

FamBase implements the Signal Protocol for secure messaging:

1. **Device Registration**: Each device generates identity keys and prekeys
2. **Session Establishment**: Double Ratchet algorithm for 1:1 chats
3. **Group Messaging**: Sender Keys for efficient group encryption
4. **Key Management**: Secure key storage and backup/recovery

### Message Flow

```
1. Alice encrypts message with Bob's public key
2. Encrypted message stored in database
3. Bob receives encrypted message via Realtime
4. Bob decrypts message locally
5. Delivery receipt sent back encrypted
```

### Media Encryption

```
1. Generate random symmetric key
2. Encrypt media file with AES-GCM
3. Upload encrypted file to Supabase Storage
4. Encrypt symmetric key with recipient's public key
5. Send encrypted key with message metadata
```

## 🗄️ Database Schema

The database includes tables for:

- **Users & Profiles**: User accounts and profile information
- **Conversations**: Chat metadata and settings
- **Messages**: Encrypted message storage
- **Devices**: Device keys and push tokens
- **Contacts**: Contact synchronization
- **Media**: File metadata and encryption keys

See `packages/database/schema.sql` for the complete schema.

## 🔧 Configuration

### Supabase Setup

1. **Authentication**: Enable phone authentication
2. **Storage**: Create `media` bucket with RLS policies
3. **Realtime**: Enable for messages and presence
4. **Edge Functions**: Deploy for push notifications and TURN auth

### Push Notifications

1. **FCM**: Configure Firebase project and get server key
2. **APNs**: Set up Apple Push Notification certificates
3. **Web Push**: Generate VAPID keys for web notifications

### WebRTC Calls

1. **STUN Server**: Use public STUN servers or deploy your own
2. **TURN Server**: Deploy coturn server for NAT traversal
3. **Signaling**: Use Supabase Realtime for call signaling

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Encryption Guide](docs/encryption.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @fambase/crypto test
pnpm --filter @fambase/shared test
```

## 🚀 Deployment

### Web App (Vercel)

```bash
# Deploy to Vercel
vercel --prod
```

### Mobile App

```bash
# Build for app stores
cd apps/mobile
eas build --platform all
eas submit --platform all
```

### Self-Hosting

See [deployment guide](docs/deployment.md) for self-hosting instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

Please read our [Contributing Guide](docs/contributing.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Legal Notice

This project reimplements WhatsApp-like functionality for educational and migration purposes. Do not use WhatsApp trademarks, logos, or copyrighted assets. Consult legal counsel before commercial use.

## 🙏 Acknowledgments

- [Signal Protocol](https://signal.org/docs/) for encryption design
- [Supabase](https://supabase.com/) for backend infrastructure
- [Expo](https://expo.dev/) for mobile development platform
- [Next.js](https://nextjs.org/) for web framework

## 📞 Support

- 📧 Email: support@fambase.dev
- 💬 Discord: [Join our community](https://discord.gg/fambase)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/fambase/issues)

---

**Built with ❤️ by the FamBase team**

