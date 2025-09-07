# Rupture Chat App 💬

A fully functional WhatsApp-like chat application built with React, React Native, and Supabase.

## Features ✨

- **Real-time messaging** with instant delivery
- **Cross-platform** - Web (React) and Mobile (React Native)
- **Dark theme UI** with modern design
- **File sharing** - Upload and share images
- **User authentication** with secure JWT tokens
- **Group chats** and 1:1 conversations
- **Message history** with timestamps
- **Responsive design** for all screen sizes

## Tech Stack 🛠️

- **Frontend**: React (Web) + React Native (Mobile)
- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Subscriptions
- **Storage**: Supabase Storage
- **Authentication**: JWT + Supabase Auth

## Project Structure 📁

```
rupture/
├── backend/          # Node.js/Express API server
├── web/             # React web application
├── mobile/          # React Native mobile app
├── shared/          # Shared utilities and types
├── database/        # Database schema and migrations
└── docs/            # Documentation
```

## Quick Start 🚀

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd rupture
   npm run install-all
   ```

2. **Set up Supabase**:
   - Create a new Supabase project
   - Copy `.env.example` to `.env` and fill in your Supabase credentials
   - Run the database schema (see `database/schema.sql`)

3. **Start development servers**:
   ```bash
   npm run dev  # Starts both backend and web
   ```

4. **For mobile development**:
   ```bash
   npm run mobile
   ```

## Setup Instructions 📋

For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md)

## API Documentation 📖

API endpoints and usage examples are available in [docs/API.md](docs/API.md)

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License 📄

MIT License - see LICENSE file for details

---

Built with ❤️ by mrNorthernLight
