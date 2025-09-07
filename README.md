# FamBase - WhatsApp Clone

A full-featured WhatsApp clone built with React 18, Vite, TailwindCSS, and Supabase. Features real-time messaging, voice/video calls, file sharing, and a sleek neon-themed dark UI.

![FamBase Screenshot](https://via.placeholder.com/800x400/000000/39ff14?text=FamBase+WhatsApp+Clone)

## ✨ Features

### 🔐 Authentication
- Email/password authentication with Supabase Auth
- JWT token persistence
- Automatic user profile creation
- Secure session management

### 👤 User Profiles
- Customizable display names and usernames
- Avatar upload with Supabase Storage
- Status messages
- Online/offline presence indicators
- Last seen timestamps

### 💬 Real-time Messaging
- 1:1 and group conversations
- Real-time message delivery via Supabase Realtime
- Message read receipts (delivered/seen indicators)
- Typing indicators
- Message timestamps with relative time display

### 📎 Media & File Sharing
- Image, video, and audio file uploads
- Voice message recording
- File attachments with download links
- Automatic media preview
- Unlimited file size uploads

### 👥 Group Chats
- Create and manage group conversations
- Add/remove group members
- Group names and avatars
- Member management

### 📞 Voice & Video Calls
- WebRTC-powered 1:1 audio/video calls
- Supabase Realtime for call signaling
- Call controls (mute, camera toggle, speaker)
- Call duration tracking
- Incoming call notifications

### 🎨 Modern UI/UX
- WhatsApp Web-inspired layout
- Neon green theme with dark backgrounds
- Responsive design (desktop & mobile)
- Smooth animations and transitions
- Emoji picker integration
- Custom scrollbars

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Supabase (Database, Auth, Storage, Realtime)
- **Real-time**: Supabase Realtime subscriptions
- **Calls**: WebRTC with Supabase Realtime signaling
- **File Storage**: Supabase Storage buckets
- **Styling**: TailwindCSS with custom neon theme
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- A Supabase account and project

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FamBase
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

#### Apply Database Schema
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script to create all tables, policies, and functions

#### Set Up Storage Buckets
The SQL script automatically creates the required storage buckets:
- `avatars` - for user profile pictures
- `message-attachments` - for file uploads

#### Enable Realtime
1. Go to Database → Replication in your Supabase dashboard
2. Enable realtime for these tables:
   - `users`
   - `messages`
   - `chats`
   - `chat_participants`

### 4. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Start the Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📱 Usage

### Getting Started
1. **Sign Up**: Create a new account with email and password
2. **Complete Profile**: Set your display name and status message
3. **Find Contacts**: Search for other users by username
4. **Start Chatting**: Click on a contact to start a conversation

### Messaging
- Type messages in the input field at the bottom
- Press Enter to send (Shift+Enter for new line)
- Click the paperclip icon to attach files
- Click the emoji icon to add emojis
- Hold the microphone icon to record voice messages

### Calls
- Click the phone icon for audio calls
- Click the video icon for video calls
- Use call controls to mute/unmute, toggle camera, or end calls

### Groups
- Click the "+" button in the sidebar
- Select "New Group" from the menu
- Choose contacts and enter a group name

## 🏗️ Project Structure

```
FamBase/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── Auth.jsx       # Authentication forms
│   │   ├── Dashboard.jsx  # Main app container
│   │   ├── Sidebar.jsx    # Left sidebar with chats
│   │   ├── ChatList.jsx   # Chat list component
│   │   ├── ChatWindow.jsx # Active chat interface
│   │   ├── MessageBubble.jsx # Individual message display
│   │   ├── MessageInput.jsx  # Message input with attachments
│   │   ├── CallUI.jsx     # WebRTC call interface
│   │   └── Profile.jsx    # User profile settings
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── supabaseClient.js  # Supabase configuration
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # App entry point
│   └── index.css         # Global styles
├── supabase-schema.sql    # Database schema
├── tailwind.config.js     # TailwindCSS configuration
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies and scripts
```

## 🎨 Theme Customization

The app uses a custom neon theme defined in `tailwind.config.js`:

```javascript
colors: {
  'neon-green': '#39ff14',      // Primary accent color
  'dark-bg': '#1a1a1a',        // Main background
  'darker-bg': '#0f0f0f',      // Darker sections
  'sidebar-bg': '#111111',     // Sidebar background
  'chat-bg': '#000000',        // Chat area background
  'input-bg': '#1f1f1f',       // Input fields
  'border-dark': '#333333',    // Borders
  // ... more colors
}
```

## 🔧 Configuration

### File Upload Limits
- Maximum file size: Unlimited
- Supported formats: Images, videos, audio, PDFs, documents
- Storage: Supabase Storage with public access

### WebRTC Configuration
- STUN servers: Google's public STUN servers
- Signaling: Supabase Realtime channels
- Media constraints: Audio always enabled, video for video calls

### Real-time Features
- Message delivery: Instant via Supabase Realtime
- Typing indicators: 3-second timeout
- Presence: Online/offline status updates
- Call signaling: WebRTC offer/answer exchange

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Environment Variables for Production
Make sure to set these environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🔒 Security Features

- Row Level Security (RLS) policies on all database tables
- Authenticated file uploads only
- Input validation and sanitization
- Secure WebRTC peer connections
- JWT-based authentication

## 🐛 Troubleshooting

### Common Issues

**Messages not appearing in real-time**
- Check if Realtime is enabled for the `messages` table in Supabase
- Verify your Supabase URL and anon key are correct

**File uploads failing**
- Check storage bucket policies in Supabase
- Ensure storage buckets exist (`avatars`, `message-attachments`)
- Verify network connectivity for large file uploads

**Calls not connecting**
- Check browser permissions for camera/microphone
- Verify WebRTC is supported in your browser
- Check network connectivity and firewall settings

**Authentication issues**
- Verify Supabase Auth is enabled
- Check email confirmation settings
- Ensure RLS policies are correctly applied

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend-as-a-service
- [TailwindCSS](https://tailwindcss.com) for the utility-first CSS framework
- [Lucide](https://lucide.dev) for the beautiful icons
- [React](https://reactjs.org) for the powerful UI library
- WhatsApp for the design inspiration

## 📞 Support

If you have any questions or need help setting up FamBase, please:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Join our community discussions

---

**Built with ❤️ and ⚡ by the FamBase team**
