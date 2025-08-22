# Academy 2025 - Interactive Learning Platform

A modern, AI-powered learning platform built with Next.js, Firebase, and Genkit AI. This application provides personalized learning experiences with real-time progress tracking, AI tutoring, and comprehensive course management.

## 🚀 Features

### Core Learning Features
- **Interactive Courses**: Structured learning paths with lessons, practice exercises, and assessments
- **AI-Powered Tutoring**: Personalized guidance and feedback using Genkit AI
- **Progress Tracking**: Real-time course progress, XP system, and skill analytics
- **Adaptive Learning**: AI-generated course suggestions based on user strengths/weaknesses

### User Experience
- **Real User Authentication**: Firebase-powered login/signup with Google integration
- **Personalized Dashboard**: User-specific learning statistics and recommendations
- **Achievement System**: Badges, XP, and level progression
- **Leaderboard**: Competitive learning with real-time rankings

### Technical Features
- **Real Data Storage**: Firebase Firestore for persistent user data
- **Responsive Design**: Modern UI built with Tailwind CSS and Radix UI
- **TypeScript**: Full type safety throughout the application
- **Real-time Updates**: Live data synchronization across components

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Firebase (Authentication, Firestore)
- **AI Integration**: Genkit AI with Google AI
- **State Management**: React Context + Custom Hooks
- **Charts**: Recharts for data visualization

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (see [Firebase Setup Guide](./FIREBASE_SETUP.md))

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Academy-25
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Follow the [Firebase Setup Guide](./FIREBASE_SETUP.md)
   - Create `.env.local` with your Firebase configuration

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler
- `npm run genkit:dev` - Start Genkit AI development server

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/            # Admin panel pages
│   ├── courses/          # Course viewing pages
│   ├── dashboard/        # User dashboard
│   ├── profile/          # User profile
│   └── leaderboard/      # Leaderboard
├── components/            # Reusable UI components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard widgets
│   ├── courses/          # Course-related components
│   └── ui/               # Base UI components
├── lib/                   # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   ├── courses.ts        # Course data management
│   └── utils.ts          # Helper functions
├── hooks/                 # Custom React hooks
├── ai/                    # AI integration with Genkit
└── data/                  # Static course data
```

## 🔐 Authentication

The application supports multiple authentication methods:
- **Email/Password**: Traditional signup/login
- **Google OAuth**: One-click Google sign-in
- **Profile Management**: User profiles with learning progress

## 📊 Data Management

### User Data
- Learning progress and course completion
- XP points and level progression
- Skill assessments and strengths/weaknesses
- Achievement badges and streaks

### Course Data
- Structured lesson content
- Practice exercises and quizzes
- Project-based assessments
- Progress tracking per course

## 🤖 AI Integration

Powered by Genkit AI, the platform provides:
- **Personalized Learning Plans**: AI-generated study recommendations
- **Smart Feedback**: Intelligent assessment and guidance
- **Course Generation**: AI-assisted course creation
- **Adaptive Tutoring**: Personalized help based on user needs

## 🎨 UI Components

Built with a comprehensive design system:
- **Responsive Layout**: Works on all device sizes
- **Dark/Light Mode**: Theme support (configurable)
- **Accessibility**: WCAG compliant components
- **Modern Design**: Clean, intuitive interface

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices
- Touch interfaces

## 🔒 Security

- **Firebase Security Rules**: Secure data access
- **Authentication Required**: Protected routes and data
- **User Isolation**: Users can only access their own data
- **Input Validation**: Client and server-side validation

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Compatible with Next.js static export
- **Firebase Hosting**: Direct integration with Firebase
- **Docker**: Containerized deployment option

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the [Firebase Setup Guide](./FIREBASE_SETUP.md)
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Social learning features
- [ ] Mobile app (React Native)
- [ ] Offline learning support
- [ ] Multi-language support
- [ ] Advanced AI tutoring
- [ ] Course marketplace
- [ ] Certification system

---

Built with ❤️ using Next.js, Firebase, and Genkit AI
