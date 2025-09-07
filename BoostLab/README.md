# BoostLab - Global Car Tuning Parts Webshop

🚗⚡ A comprehensive, dark-themed car tuning parts e-commerce platform with Firebase backend, supporting web and mobile clients.

## 🌟 Features

### Core Functionality
- **Multi-Platform Support**: React/Next.js web app + Flutter mobile app
- **Dark Theme**: Professional dark UI with neon highlights (#39FF14, #FF6F00, #00BFFF)
- **Firebase Backend**: Complete serverless architecture
- **User Garage**: Save multiple cars with compatibility matching
- **3D/AR Previews**: Interactive part visualization
- **Multi-Role System**: Users, Vendors, and Admins

### Advanced Features
- **Smart Compatibility**: Dynamic part-to-car matching
- **Recommendation Engine**: AI-powered part suggestions
- **Real-time Inventory**: Live stock updates
- **Multi-Currency**: Global payment support
- **Community Features**: Reviews, ratings, build sharing
- **Push Notifications**: Order updates and promotions

## 🎨 Design System

### Color Palette
- **Backgrounds**: #121212 (primary), #1F1F1F (secondary), #2C2C2C (elevated)
- **Text**: #FFFFFF (primary), #B0B0B0 (secondary)
- **Highlights**: #39FF14 (neon green), #FF6F00 (electric orange), #00BFFF (turbo blue)

## 🏗️ Architecture

```
BoostLab/
├── web/                    # Next.js web application
├── mobile/                 # Flutter mobile app
├── functions/              # Firebase Cloud Functions
├── firestore/             # Database schema & sample data
├── docs/                  # Documentation
└── firebase.json          # Firebase configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI
- Flutter SDK (for mobile)

### Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Install dependencies
cd web && npm install
cd ../functions && npm install

# Start development
npm run dev
```

## 📱 Platforms

### Web (Next.js)
- Responsive design
- Three.js 3D previews
- Progressive Web App
- SEO optimized

### Mobile (Flutter)
- Native performance
- AR integration
- Push notifications
- Offline support

## 🔥 Firebase Services

- **Firestore**: Real-time database
- **Authentication**: Multi-provider auth
- **Storage**: Media and 3D assets
- **Cloud Functions**: Business logic
- **Cloud Messaging**: Push notifications
- **Hosting**: Web deployment

## 📊 Database Schema

### Collections
- `users` - User profiles and garage
- `cars` - Car database
- `parts` - Product catalog
- `reviews` - User reviews
- `orders` - Purchase history
- `promotions` - Discount codes

## 🛡️ Security

- Role-based access control
- Firestore security rules
- Input validation
- Rate limiting

## 📈 Performance

- Lazy loading
- Image optimization
- CDN delivery
- Caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ for the car tuning community
