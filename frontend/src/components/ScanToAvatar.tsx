import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CameraScanEffect } from './CameraScanEffect';
import { Loader2 } from 'lucide-react';

type ScanState = 'scanning' | 'transitioning';

export function ScanToAvatar() {
  const [state, setState] = useState<ScanState>('scanning');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleScanComplete = () => {
    setState('transitioning');
    // After transition animation, navigate to echo-body page (which will show sidebar)
    setTimeout(() => {
      navigate('/echo-body');
    }, 1500);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    // Auto-dismiss error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {state === 'scanning' && (
          <motion.div
            key="scan"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <CameraScanEffect
              onScanComplete={handleScanComplete}
              onError={handleError}
            />
          </motion.div>
        )}

        {state === 'transitioning' && (
          <motion.div
            key="transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-cyan-400 mb-2">
                SCAN COMPLETE
              </h2>
              <p className="text-xl text-cyan-300">
                Initializing EchoBody...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg z-50"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}

