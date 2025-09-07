
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'

function App() {
  return (
    <div className="min-h-screen bg-neutral-light p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gradient mb-4">
            ClassConnect
          </h1>
          <p className="text-xl text-neutral-text mb-2">
            Bright School-Inspired Edition
          </p>
          <p className="text-neutral-text/70">
            A comprehensive educational platform for students, teachers, and administrators
          </p>
        </header>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card hover>
            <CardHeader>
              <CardTitle className="text-primary-700">
                🎓 Role-Based Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Students, Teachers, and Admins each have tailored experiences with appropriate permissions and features.</p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="text-accent-green">
                💬 Real-time Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Class channels, direct messages, threaded replies, and file sharing with real-time updates.</p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="text-accent-orange">
                📹 Video Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>1:1 and group video calls with screen sharing, recording, and call management features.</p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="text-accent-yellow text-neutral-dark">
                📚 Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Create, submit, and grade assignments with due dates, file attachments, and feedback.</p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="text-primary-700">
                📁 File Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Organized file storage by class and channel with drag-and-drop uploads and permissions.</p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle className="text-accent-green">
                📊 Teacher Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Comprehensive analytics, class management, and engagement tracking for educators.</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <Button variant="primary" size="lg">
            Get Started
          </Button>
          <Button variant="accent-yellow" size="lg">
            View Demo
          </Button>
          <Button variant="accent-green" size="lg">
            Learn More
          </Button>
          <Button variant="accent-orange" size="lg">
            Contact Us
          </Button>
        </div>

        {/* Technology Stack */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              🛠️ Built with Modern Technology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-primary-50 rounded-lg">
                <div className="text-2xl mb-2">⚛️</div>
                <div className="font-medium">React + TypeScript</div>
              </div>
              <div className="p-4 bg-accent-green/10 rounded-lg">
                <div className="text-2xl mb-2">🗄️</div>
                <div className="font-medium">Supabase</div>
              </div>
              <div className="p-4 bg-accent-yellow/20 rounded-lg">
                <div className="text-2xl mb-2">🎨</div>
                <div className="font-medium">Tailwind CSS</div>
              </div>
              <div className="p-4 bg-accent-orange/10 rounded-lg">
                <div className="text-2xl mb-2">📡</div>
                <div className="font-medium">WebRTC</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-center text-neutral-text/70">
              Designed for scalability, security, and an amazing user experience
            </p>
          </CardFooter>
        </Card>

        {/* Footer */}
        <footer className="text-center mt-12 text-neutral-text/60">
          <p>ClassConnect - Connecting students, teachers, and knowledge 🌟</p>
        </footer>
      </div>
    </div>
  )
}

export default App
