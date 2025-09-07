# ClassConnect: Bright School-Inspired Edition

A comprehensive educational platform designed for students, teachers, and administrators with a bright, engaging, school-themed interface.

## 🌟 Features

### 🎓 Role-Based Access Control
- **Students**: Join classes, submit homework, chat, join calls, share files
- **Teachers**: Manage classes, assignments, calls, monitor engagement, moderate content
- **Admins**: Platform oversight, user management, safety enforcement

### 💬 Real-time Communication
- Class channels for announcements and discussions
- Sub-channels for projects, clubs, or subjects
- Direct messages (1:1) between users
- Threaded replies and message reactions
- Typing indicators and message status
- File and media sharing in chat

### 📹 Video & Voice Calls
- 1:1 calls accessible from chat
- Group calls for classes and channels
- Screen sharing capabilities
- Optional call recording for teachers
- Real-time call notifications
- WebRTC-powered for high quality

### 📚 Assignment Management
- Teachers create assignments with due dates and instructions
- Students submit work directly in platform
- Grading and feedback system
- Progress tracking and analytics
- Deadline notifications

### 📁 File Management
- Organized storage by class and channel
- Drag-and-drop file uploads
- Permission-based access control
- File versioning and history
- Preview capabilities for common formats

### 📊 Teacher Dashboard
- Class and channel management
- Student engagement analytics
- Content moderation tools
- Grade export functionality
- Announcement scheduling

## 🎨 Design System

### Color Palette
- **Sky Blue** (#4FC3F7) - Primary actions and highlights
- **Sunshine Yellow** (#FFEB3B) - Notifications and badges
- **Grass Green** (#8BC34A) - Success states and confirmations
- **Coral Orange** (#FF7043) - Warnings and attention items
- **Light Grey** (#F5F5F5) - Background
- **Chalkboard Dark** (#263238) - Headers and navigation

### Typography
- **Primary Font**: Poppins (friendly, modern)
- **Fallbacks**: Nunito, Roboto, system fonts
- **Weights**: 300, 400, 500, 600, 700

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Database, Auth, Realtime, Storage)
- **Styling**: Tailwind CSS with custom design system
- **Video Calls**: WebRTC
- **Icons**: Lucide React
- **State Management**: React Context + Custom Hooks

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd classconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Database Schema

### Core Tables
- `users` - User profiles with roles
- `classes` - Class information and teacher assignments
- `class_members` - Student-class relationships
- `channels` - Communication channels within classes
- `messages` - Chat messages and media
- `assignments` - Homework and project assignments
- `submissions` - Student assignment submissions
- `files` - File storage metadata
- `calls` - Video/voice call records
- `dm_chats` - Direct message conversations

### Security
- Row Level Security (RLS) policies
- Role-based access control
- Email domain validation for school accounts

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements (Button, Card, etc.)
│   ├── layout/         # Layout components (Sidebar, TopBar)
│   ├── auth/           # Authentication components
│   ├── chat/           # Chat and messaging
│   ├── assignments/    # Assignment management
│   ├── files/          # File handling
│   ├── calls/          # Video/voice calls
│   └── dashboard/      # Dashboard and analytics
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── types/              # TypeScript type definitions
├── styles/             # Global styles and theme
├── pages/              # Page components
├── router/             # Routing configuration
└── utils/              # Utility functions
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Consistent naming conventions
- Component-based architecture

## 🔐 Security Features

- Supabase Authentication with email verification
- Row Level Security (RLS) policies
- Role-based permissions
- Content moderation tools
- File upload restrictions
- HTTPS enforcement

## 📱 Responsive Design

- Mobile-first approach
- Responsive breakpoints for all screen sizes
- Touch-friendly interface
- Progressive Web App (PWA) capabilities

## 🚀 Deployment

### Supabase Setup
1. Create a new Supabase project
2. Run the database migrations
3. Set up authentication providers
4. Configure storage buckets
5. Enable realtime subscriptions

### Production Build
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Supabase team for the excellent backend platform
- React and Vite communities
- Tailwind CSS for the utility-first approach
- All contributors and testers

---

**ClassConnect** - Connecting students, teachers, and knowledge 🌟

