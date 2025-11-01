import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Volume2, 
  PlayCircle, 
  Brain,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Smile,
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const glossaryTerms = [
  {
    id: 1,
    term: 'Range of Motion (ROM)',
    category: 'Metrics',
    bodyArea: 'All',
    phase: 'All Phases',
    simpleDef: 'How far your joint can move in different directions.',
    analogy: 'Think of it like how wide a door opens.',
    aiConfidence: 0.98,
    whyMatters: 'Improving ROM helps reduce pain and prevent reinjury. It shows your joint is healing properly.',
    howToImprove: [
      'Perform gentle stretching exercises daily',
      'Use heat before exercises to loosen muscles',
      'Track progress with your clinician each week'
    ],
    relatedExercises: ['Shoulder Rotation', 'Neck Mobility'],
    icon: '🔄'
  },
  {
    id: 2,
    term: 'Eccentric Training',
    category: 'Common Terms',
    bodyArea: 'All',
    phase: 'Strengthening',
    simpleDef: 'Exercises where your muscle lengthens while working.',
    analogy: 'Like slowly lowering a grocery bag — you control the descent.',
    aiConfidence: 0.95,
    whyMatters: 'Builds strength and control, reduces injury risk during movements.',
    howToImprove: [
      'Focus on the lowering phase of exercises',
      'Count to 3-5 seconds while lowering',
      'Use lighter weights to master the technique'
    ],
    relatedExercises: ['Wall Push-up'],
    icon: '⬇️'
  },
  {
    id: 3,
    term: 'Stabilization',
    category: 'Common Terms',
    bodyArea: 'Core',
    phase: 'All Phases',
    simpleDef: 'Keeping your body steady and balanced during movement.',
    analogy: 'Like a table with four strong legs — it doesn\'t wobble.',
    aiConfidence: 0.97,
    whyMatters: 'Prevents compensatory movements that can cause pain elsewhere.',
    howToImprove: [
      'Practice core engagement exercises',
      'Use mirror feedback during exercises',
      'Start with static holds before moving'
    ],
    relatedExercises: ['Core Stability', 'Spinal Twist'],
    icon: '🧘'
  },
  {
    id: 4,
    term: 'Pain Scale (0-10)',
    category: 'Metrics',
    bodyArea: 'All',
    phase: 'All Phases',
    simpleDef: 'A number rating to describe how much something hurts.',
    analogy: '0 is no pain, 5 is noticeable, 10 is the worst pain you can imagine.',
    aiConfidence: 1.0,
    whyMatters: 'Helps track your recovery progress and adjust exercises safely.',
    howToImprove: [
      'Be honest about pain levels',
      'Track pain before and after exercises',
      'Tell your physio if pain increases'
    ],
    relatedExercises: [],
    icon: '📊'
  },
  {
    id: 5,
    term: 'Proprioception',
    category: 'Common Terms',
    bodyArea: 'All',
    phase: 'Return to Activity',
    simpleDef: 'Your body\'s ability to sense where it is in space.',
    analogy: 'Like knowing where your hand is even with your eyes closed.',
    aiConfidence: 0.93,
    whyMatters: 'Essential for balance, coordination, and preventing re-injury.',
    howToImprove: [
      'Practice balance exercises',
      'Try single-leg stands',
      'Close your eyes during stable exercises'
    ],
    relatedExercises: ['Ankle Circles'],
    icon: '⚖️'
  },
  {
    id: 6,
    term: 'Isometric Exercise',
    category: 'Common Terms',
    bodyArea: 'All',
    phase: 'Mobility',
    simpleDef: 'Exercises where you hold still while your muscles work.',
    analogy: 'Like pushing against a wall — no movement, but your muscles are working.',
    aiConfidence: 0.96,
    whyMatters: 'Builds strength without stressing healing joints.',
    howToImprove: [
      'Hold positions for 10-30 seconds',
      'Focus on breathing while holding',
      'Gradually increase hold time'
    ],
    relatedExercises: ['Scapular Squeezes'],
    icon: '🛑'
  }
];

const videoExamples = [
  { id: 1, title: 'Understanding ROM', duration: '0:15' },
  { id: 2, title: 'Eccentric vs Concentric', duration: '0:20' },
  { id: 3, title: 'Core Stabilization Demo', duration: '0:18' }
];

const searchTrendsData = [
  { term: 'ROM', searches: 45 },
  { term: 'Eccentric', searches: 32 },
  { term: 'Stabilization', searches: 28 },
  { term: 'Pain Scale', searches: 25 },
  { term: 'Proprioception', searches: 18 }
];

const understandingTrendData = [
  { week: 'Week 1', rating: 3.2 },
  { week: 'Week 2', rating: 3.8 },
  { week: 'Week 3', rating: 4.1 },
  { week: 'Week 4', rating: 4.5 }
];

interface RehabClarityHubProps {
  userRole?: 'patient' | 'clinician';
}

export function RehabClarityHub({ userRole = 'patient' }: RehabClarityHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState<typeof glossaryTerms[0] | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [videoIndex, setVideoIndex] = useState(0);

  const filteredTerms = glossaryTerms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         term.simpleDef.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessages = [
      ...chatMessages,
      { role: 'user' as const, text: chatInput }
    ];
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = getAIResponse(chatInput);
      setChatMessages([...newMessages, { role: 'ai', text: aiResponse }]);
    }, 500);
    
    setChatMessages(newMessages);
    setChatInput('');
  };

  const getAIResponse = (question: string): string => {
    if (question.toLowerCase().includes('eccentric')) {
      return "Eccentric training is when your muscle lengthens while it works — like slowly lowering a weight. It builds control and strength. Would you like me to show you an animation?";
    }
    if (question.toLowerCase().includes('rom')) {
      return "ROM stands for Range of Motion - it's how far your joint can move. Think of it like a door hinge opening and closing. Better ROM means less stiffness and more freedom of movement!";
    }
    return "Great question! That's related to how your body heals and builds strength. Let me break that down for you in simple terms...";
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-[#2C2E6F] mb-2 flex items-center justify-center gap-2">
          <Brain className="w-8 h-8" />
          RehabClarity Hub — Understand Your Recovery
        </h1>
        <p className="text-gray-600">AI-powered plain-language explanations for physio terms</p>
      </div>

      {/* Search Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search any term (e.g., ROM, eccentric, stabilization)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>

          {/* Filter Tabs */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {['All', 'Common Terms', 'Metrics', 'Body Areas', 'Recovery Phases'].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'bg-[#2C2E6F]' : ''}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Quick Filters */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#2C2E6F]">Quick Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['Shoulder', 'Knee', 'Back', 'Neck', 'Pain Scale'].map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:bg-[#E9E6F9] hover:text-[#2C2E6F] hover:border-[#2C2E6F]"
                >
                  {tag}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Featured Videos */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-[#E9E6F9] to-white">
            <CardHeader>
              <CardTitle className="text-[#2C2E6F] text-sm">Featured Videos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <PlayCircle className="w-12 h-12 text-[#2C2E6F]" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#2C2E6F]">{videoExamples[videoIndex].title}</p>
                  <p className="text-xs text-gray-500">{videoExamples[videoIndex].duration}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVideoIndex((prev) => (prev > 0 ? prev - 1 : videoExamples.length - 1))}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVideoIndex((prev) => (prev < videoExamples.length - 1 ? prev + 1 : 0))}
                  className="flex-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Term Cards */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTerms.map((term) => (
              <Card
                key={term.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setSelectedTerm(term)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{term.icon}</span>
                      <h4 className="text-[#2C2E6F]">{term.term}</h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {term.category}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700">{term.simpleDef}</p>

                  <div className="p-3 bg-[#E9E6F9] rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-[#2C2E6F] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-700 italic">{term.analogy}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={(e) => e.stopPropagation()}>
                      <Volume2 className="w-3 h-3" />
                      Listen
                    </Button>
                    <Button size="sm" className="flex-1 bg-[#4DD2C1] hover:bg-[#3bc1b0] gap-1">
                      Examples
                    </Button>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      {term.whyMatters.split('.')[0]}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTerms.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">No terms found. Try a different search or category.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Analytics Section for Clinicians */}
      {userRole === 'clinician' && (
        <>
          <Separator className="my-8" />
          
          <div>
            <h2 className="text-[#2C2E6F] mb-4">Patient Education Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Searched Terms */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#2C2E6F]">Most Searched Terms This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={searchTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="term" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Bar dataKey="searches" fill="#2C2E6F" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Understanding Rating Trend */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#2C2E6F]">Avg Understanding Rating</CardTitle>
                    <div className="flex items-center gap-2">
                      <Smile className="w-5 h-5 text-green-600" />
                      <span className="text-2xl text-[#2C2E6F]">4.5/5</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={understandingTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis domain={[0, 5]} stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="rating" 
                        stroke="#4DD2C1" 
                        strokeWidth={3}
                        dot={{ fill: '#4DD2C1', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Stats */}
            <Card className="border-0 shadow-lg mt-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <p className="text-3xl text-[#2C2E6F]">248</p>
                    </div>
                    <p className="text-sm text-gray-600">Total Searches This Week</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-[#4DD2C1]" />
                      <p className="text-3xl text-[#2C2E6F]">89%</p>
                    </div>
                    <p className="text-sm text-gray-600">Marked "Understood"</p>
                  </div>
                  <div className="text-center">
                    <Button className="bg-[#2C2E6F] hover:bg-[#1f2050] gap-2">
                      <Download className="w-4 h-4" />
                      Download Patient Questions CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Term Detail Popup */}
      <Dialog open={!!selectedTerm} onOpenChange={() => setSelectedTerm(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedTerm && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#2C2E6F] flex items-center gap-2">
                  <span className="text-3xl">{selectedTerm.icon}</span>
                  {selectedTerm.term}
                </DialogTitle>
                <DialogDescription>
                  Let's make this simple together
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Simple Meaning */}
                <div>
                  <h4 className="text-[#2C2E6F] mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Simple Meaning
                  </h4>
                  <p className="text-gray-700 mb-2">{selectedTerm.simpleDef}</p>
                  <div className="p-3 bg-[#E9E6F9] rounded-lg">
                    <p className="text-sm text-gray-700 italic">{selectedTerm.analogy}</p>
                  </div>
                </div>

                <Separator />

                {/* Why It Matters */}
                <div>
                  <h4 className="text-[#2C2E6F] mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Why It Matters to You
                  </h4>
                  <p className="text-gray-700 mb-3">{selectedTerm.whyMatters}</p>
                  {selectedTerm.relatedExercises.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-600">Related exercises:</span>
                      {selectedTerm.relatedExercises.map((exercise, idx) => (
                        <Badge key={idx} className="bg-[#4DD2C1] text-white">
                          {exercise}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* How to Improve */}
                <div>
                  <h4 className="text-[#2C2E6F] mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    How to Improve It
                  </h4>
                  <div className="space-y-2">
                    {selectedTerm.howToImprove.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#2C2E6F] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-gray-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video Preview */}
                <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PlayCircle className="w-16 h-16 text-[#2C2E6F] mx-auto mb-2" />
                    <p className="text-sm text-gray-600">15-second explanation video</p>
                  </div>
                </div>

                {/* Feedback */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#E9E6F9] to-white rounded-lg">
                  <p className="text-sm text-gray-700">Did this help you understand?</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                      onClick={() => {
                        // Show success toast
                        setSelectedTerm(null);
                      }}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Got it!
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-2 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Still confused
                    </Button>
                  </div>
                </div>

                {/* Success Message */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-green-700">✅ Now you understand {selectedTerm.term}! Keep up the progress.</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating AI Chat */}
      {!showChat && (
        <Button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] hover:shadow-2xl shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {showChat && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 border-0 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-[#2C2E6F] to-[#4DD2C1] text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                <CardTitle className="text-white">AI Assistant</CardTitle>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowChat(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-white/90">Ask me anything you don't understand</p>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-4">Try asking:</p>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-left justify-start"
                    onClick={() => setChatInput('What is eccentric training?')}
                  >
                    "What is eccentric training?"
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-left justify-start"
                    onClick={() => setChatInput('Explain ROM to me')}
                  >
                    "Explain ROM to me"
                  </Button>
                </div>
              </div>
            )}
            
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-[#2C2E6F] text-white'
                      : 'bg-[#E9E6F9] text-gray-700'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </CardContent>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your question..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-[#4DD2C1] hover:bg-[#3bc1b0]"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
