import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  BookOpen, 
  MessageCircle, 
  Video, 
  FileText, 
  Users, 
  Calendar,
  Bell,
  Settings
} from 'lucide-react'

export function Dashboard() {
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    let greeting = 'Good morning'
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon'
    if (hour >= 17) greeting = 'Good evening'
    
    return `${greeting}, ${profile?.name}! 👋`
  }

  const getRoleSpecificCards = () => {
    switch (profile?.role) {
      case 'teacher':
        return [
          {
            title: 'My Classes',
            description: 'Manage your classes and students',
            icon: <Users className="h-6 w-6" />,
            color: 'text-primary-600',
            bgColor: 'bg-primary-50',
          },
          {
            title: 'Assignments',
            description: 'Create and grade assignments',
            icon: <FileText className="h-6 w-6" />,
            color: 'text-accent-green',
            bgColor: 'bg-accent-green/10',
          },
          {
            title: 'Analytics',
            description: 'View student engagement and progress',
            icon: <Calendar className="h-6 w-6" />,
            color: 'text-accent-orange',
            bgColor: 'bg-accent-orange/10',
          },
        ]
      case 'admin':
        return [
          {
            title: 'User Management',
            description: 'Manage students, teachers, and classes',
            icon: <Users className="h-6 w-6" />,
            color: 'text-primary-600',
            bgColor: 'bg-primary-50',
          },
          {
            title: 'System Settings',
            description: 'Configure platform settings',
            icon: <Settings className="h-6 w-6" />,
            color: 'text-accent-orange',
            bgColor: 'bg-accent-orange/10',
          },
          {
            title: 'Reports',
            description: 'View platform analytics and reports',
            icon: <FileText className="h-6 w-6" />,
            color: 'text-accent-green',
            bgColor: 'bg-accent-green/10',
          },
        ]
      default: // student
        return [
          {
            title: 'My Classes',
            description: 'View your enrolled classes',
            icon: <BookOpen className="h-6 w-6" />,
            color: 'text-primary-600',
            bgColor: 'bg-primary-50',
          },
          {
            title: 'Assignments',
            description: 'View and submit assignments',
            icon: <FileText className="h-6 w-6" />,
            color: 'text-accent-green',
            bgColor: 'bg-accent-green/10',
          },
          {
            title: 'Schedule',
            description: 'View your class schedule',
            icon: <Calendar className="h-6 w-6" />,
            color: 'text-accent-orange',
            bgColor: 'bg-accent-orange/10',
          },
        ]
    }
  }

  const commonCards = [
    {
      title: 'Messages',
      description: 'Chat with classmates and teachers',
      icon: <MessageCircle className="h-6 w-6" />,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Video Calls',
      description: 'Join or start video calls',
      icon: <Video className="h-6 w-6" />,
      color: 'text-accent-green',
      bgColor: 'bg-accent-green/10',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">ClassConnect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="secondary" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-dark">{profile?.name}</p>
                  <p className="text-xs text-neutral-text/60 capitalize">{profile?.role}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-neutral-dark mb-2">
            {getWelcomeMessage()}
          </h2>
          <p className="text-neutral-text">
            Welcome to your ClassConnect dashboard. Here's what's happening today.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-neutral-dark">5</p>
                  <p className="text-sm text-neutral-text">Active Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent-yellow/20 rounded-lg">
                  <FileText className="h-6 w-6 text-neutral-dark" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-neutral-dark">3</p>
                  <p className="text-sm text-neutral-text">Pending Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent-green/10 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-accent-green" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-neutral-dark">12</p>
                  <p className="text-sm text-neutral-text">New Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-accent-orange/10 rounded-lg">
                  <Video className="h-6 w-6 text-accent-orange" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-neutral-dark">2</p>
                  <p className="text-sm text-neutral-text">Upcoming Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...getRoleSpecificCards(), ...commonCards].map((card, index) => (
            <Card key={index} hover className="cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <div className={card.color}>{card.icon}</div>
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-text">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-neutral-light rounded-lg">
                <div className="p-2 bg-primary-50 rounded-full">
                  <MessageCircle className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-dark">
                    New message in Mathematics Class
                  </p>
                  <p className="text-xs text-neutral-text/60">2 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-neutral-light rounded-lg">
                <div className="p-2 bg-accent-green/10 rounded-full">
                  <FileText className="h-4 w-4 text-accent-green" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-dark">
                    Assignment submitted: Physics Lab Report
                  </p>
                  <p className="text-xs text-neutral-text/60">1 hour ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-neutral-light rounded-lg">
                <div className="p-2 bg-accent-orange/10 rounded-full">
                  <Video className="h-4 w-4 text-accent-orange" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-dark">
                    Video call ended: Chemistry Study Group
                  </p>
                  <p className="text-xs text-neutral-text/60">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
