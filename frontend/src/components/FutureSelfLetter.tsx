import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { Mail, Lock, Unlock, Sparkles, Mic, Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export function FutureSelfLetter() {
  const [letterText, setLetterText] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [showUnlocked, setShowUnlocked] = useState(false);
  const [hasWritten, setHasWritten] = useState(false);

  const currentWeek = 2;
  const unlockWeek = 6;
  const progressPercent = (currentWeek / unlockWeek) * 100;
  const unlockDate = 'December 15, 2025';

  const sampleLockedLetter = `Dear Future Me,

I know recovery feels tough right now. My shoulder still hurts, and some days I wonder if I'll ever get back to playing tennis.

But I'm choosing to believe in this process. I'm choosing to show up, even when it's hard. I'm choosing to trust that these small movements today will become strength tomorrow.

When you read this, I hope you remember how far you've come. I hope you're proud of yourself for not giving up.

You've got this. We've got this.

- Rose, Week 2`;

  const handleSubmit = () => {
    if (letterText.trim()) {
      setHasWritten(true);
      setIsLocked(true);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setShowUnlocked(true);
  };

  const suggestionPrompts = [
    'Dear Future Me...',
    'I know recovery feels hard right now, but...',
    'When you read this, I hope you remember...',
    'The person I want to become is...'
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] rounded-2xl mb-4">
          <Mail className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-[#2C2E6F] mb-2">Letter to Your Future Self</h1>
        <p className="text-gray-600">
          Write a message to yourself. Unlock it when you reach your recovery milestone.
        </p>
      </div>

      {/* Unlock Progress */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[#E9E6F9] to-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              {isLocked ? (
                <Lock className="w-8 h-8 text-[#2C2E6F]" />
              ) : (
                <Unlock className="w-8 h-8 text-[#4DD2C1]" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600">Progress to Unlock</p>
                <Badge className="bg-[#2C2E6F]">Week {currentWeek} of {unlockWeek}</Badge>
              </div>
              <Progress value={progressPercent} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">
                {isLocked ? `Unlocks on ${unlockDate}` : 'Letter Unlocked! 🎉'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Write Letter Section */}
      {!hasWritten ? (
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-[#2C2E6F] flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Write Your Letter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E9E6F9]/20 to-transparent rounded-xl pointer-events-none" />
              <Textarea
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                placeholder="What would you tell yourself when recovery feels hard?"
                className="min-h-[300px] bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-[#2C2E6F] resize-none"
              />
            </div>

            {/* AI Suggestions */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Need inspiration? Try starting with:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestionPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setLetterText(prompt + '\n\n')}
                    className="text-sm hover:bg-[#E9E6F9] hover:text-[#2C2E6F] hover:border-[#2C2E6F]"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Voice Record Option */}
            <div className="flex items-center gap-3 p-4 bg-[#E9E6F9] rounded-xl">
              <Mic className="w-5 h-5 text-[#2C2E6F]" />
              <div className="flex-1">
                <p className="text-sm text-[#2C2E6F]">Prefer to speak?</p>
                <p className="text-xs text-gray-600">Record a voice message instead</p>
              </div>
              <Button variant="outline" size="sm">
                Record
              </Button>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleSubmit}
                disabled={!letterText.trim()}
                className="flex-1 bg-gradient-to-r from-[#2C2E6F] to-[#4DD2C1] text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Lock className="w-4 h-4 mr-2" />
                Seal Letter (Lock until Week {unlockWeek})
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Locked Letter Display */
        <Card className="border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#2C2E6F] to-[#4DD2C1] rounded-full mb-6 animate-pulse">
              <Lock className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-[#2C2E6F] mb-2">Letter Sealed 🔒</h2>
            <p className="text-gray-600 mb-6">
              Your letter is safely stored and will unlock on {unlockDate}
            </p>

            <div className="max-w-md mx-auto space-y-4">
              <div className="p-6 bg-gradient-to-br from-[#E9E6F9] to-white rounded-xl">
                <p className="text-sm text-gray-600 mb-2">Your commitment is locked in</p>
                <div className="flex items-center justify-center gap-2 text-[#2C2E6F]">
                  <Heart className="w-5 h-5 text-[#FF8A73]" />
                  <p>A promise to your future self</p>
                </div>
              </div>

              {/* Demo: Allow early unlock for testing */}
              <Button
                onClick={handleUnlock}
                variant="outline"
                className="w-full"
              >
                Preview Unlock (Demo)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unlocked Letter Dialog */}
      <Dialog open={showUnlocked} onOpenChange={setShowUnlocked}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#2C2E6F] flex items-center gap-2">
              <Unlock className="w-6 h-6 text-[#4DD2C1]" />
              Your Letter is Unlocked! 🎉
            </DialogTitle>
            <DialogDescription>
              You kept your promise. You showed up. You recovered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Confetti effect simulation */}
            <div className="text-center text-6xl animate-bounce">
              🎊 🎉 ✨
            </div>

            {/* Letter Content */}
            <div className="p-6 bg-gradient-to-br from-[#E9E6F9] to-white rounded-xl">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {letterText || sampleLockedLetter}
                </p>
              </div>
            </div>

            {/* Achievement */}
            <div className="p-6 bg-gradient-to-r from-[#2C2E6F] to-[#4DD2C1] rounded-xl text-white text-center">
              <p className="mb-2">You earned +20 XP!</p>
              <p className="text-sm opacity-90">For honoring your commitment 💖</p>
            </div>

            {/* Reflection Prompt */}
            <div className="space-y-3">
              <Label className="text-gray-700">How do you feel reading this now?</Label>
              <Textarea 
                placeholder="Reflect on your journey..."
                className="min-h-[100px]"
              />
            </div>

            <Button 
              onClick={() => setShowUnlocked(false)}
              className="w-full bg-[#2C2E6F] hover:bg-[#1f2050]"
            >
              Save Reflection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-[#FF8A73]/10 to-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Heart className="w-6 h-6 text-[#FF8A73] flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-[#2C2E6F] mb-1">Why write a letter?</h4>
              <p className="text-sm text-gray-600">
                Research shows that connecting with your future self increases motivation and adherence to recovery plans. 
                This letter becomes a powerful reminder of why you started and how far you've come.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
