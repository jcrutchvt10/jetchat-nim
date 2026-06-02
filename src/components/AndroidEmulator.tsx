/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wifi, Battery, Signal, Zap, Volume2, Moon, Sun, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AndroidEmulatorProps {
  children: React.ReactNode;
  activeScreen: 'chat' | 'labs' | 'hub' | 'sandbox';
  onScreenChange: (screen: 'chat' | 'labs' | 'hub' | 'sandbox') => void;
}

export default function AndroidEmulator({ children, activeScreen, onScreenChange }: AndroidEmulatorProps) {
  const [powerOn, setPowerOn] = React.useState(true);
  const [booting, setBooting] = React.useState(false);
  const [time, setTime] = React.useState('');
  const [battery, setBattery] = React.useState(100);
  const [showNotificationShade, setShowNotificationShade] = React.useState(false);
  const [cudaMode, setCudaMode] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  // Sync real-time clock representing mobile phone time
  React.useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  // Update battery slowly
  React.useEffect(() => {
    const interval = setInterval(() => {
      setBattery((prev) => {
        if (prev <= 10) return 100;
        return prev - 1;
      });
    }, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, []);

  const handlePowerButton = () => {
    if (powerOn) {
      setPowerOn(false);
    } else {
      setBooting(true);
      setTimeout(() => {
        setBooting(false);
        setPowerOn(true);
      }, 2000);
    }
  };

  return (
    <div className="flex h-full w-full max-w-sm mx-auto items-center justify-center p-2 md:p-4 select-none relative font-sans">
      
      {/* Physical Hardware Frame */}
      <div className="relative w-full aspect-[9/19.5] max-h-[820px] bg-[#0A0D14] rounded-[48px] border-4 border-[#2E3440] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden group">
        
        {/* Dynamic Glowing border for NVIDIA styling */}
        <div className="absolute inset-0 border border-[#76B900]/20 rounded-[44px] pointer-events-none z-50" />

        {/* Side Hardware Buttons */}
        {/* Power Button */}
        <button
          onClick={handlePowerButton}
          className="absolute right-[-4px] top-32 w-[6px] h-12 bg-rose-600 rounded-l focus:outline-none cursor-pointer z-50"
          title="Toggle phone power"
        />
        {/* Volume Up */}
        <div className="absolute left-[-4px] top-28 w-[6px] h-10 bg-gray-700 rounded-r z-50" />
        {/* Volume Down */}
        <div className="absolute left-[-4px] top-42 w-[6px] h-10 bg-gray-700 rounded-r z-50" />

        {/* Outer Frame Bezel notches */}
        <div className="absolute top-0 inset-x-0 h-7 bg-black z-40 flex items-center justify-center pointer-events-none">
          {/* Punchhole physical camera lens */}
          <div className="w-4 h-4 bg-[#111] rounded-full border border-gray-900 pointer-events-none" />
        </div>

        {/* SCREEN CANVAS */}
        <div className="flex-1 bg-[#121318] flex flex-col relative overflow-hidden h-full">
          
          <AnimatePresence mode="wait">
            {!powerOn ? (
              /* Screen black / powered off state */
              <motion.div
                key="off"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center text-gray-500 cursor-pointer"
                onClick={handlePowerButton}
              >
                <Smartphone className="w-8 h-8 opacity-30 mb-2 animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider opacity-50">Power Off</span>
                <span className="text-[9px] opacity-30 mt-1">Tap Red Button on Right to Boot</span>
              </motion.div>
            ) : booting ? (
              /* Dynamic Android Animated Boot Loop */
              <motion.div
                key="booting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center text-center p-6 text-white"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-10 h-10 border-2 border-t-[#76B900] border-gray-800 rounded-full mb-3"
                />
                <h2 className="text-[#76B900] font-bold tracking-tight text-sm uppercase">Android NIM G-Phone</h2>
                <p className="text-[9px] text-[#A6E22E] tracking-widest font-mono mt-1">POWERED BY NVIDIA CLOUD</p>
              </motion.div>
            ) : (
              /* Live OS state */
              <motion.div
                key="live"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full relative"
              >
                
                {/* Simulated Android Top Status Bar */}
                <div 
                  onClick={() => setShowNotificationShade(!showNotificationShade)}
                  className="h-7 bg-black text-white px-5 flex items-center justify-between text-[11px] font-sans font-medium select-none z-30 shrink-0 cursor-row-resize hover:bg-[#111]"
                >
                  <span>{time.split(' ')[0]}</span>
                  
                  {/* Custom middle indicators */}
                  {cudaMode && (
                    <span className="text-[8px] bg-[#76B900] text-gray-950 px-1 py-0.2 rounded font-extrabold uppercase scale-90">
                      CUDA CORE
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3.5 h-3.5 text-gray-300" />
                    <Wifi className="w-3.5 h-3.5 text-gray-300" />
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] scale-90 text-gray-400">{battery}%</span>
                      <Battery className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                    </div>
                  </div>
                </div>

                {/* SLIDING NOTIFICATION SHADE */}
                <AnimatePresence>
                  {showNotificationShade && (
                    <motion.div
                      initial={{ y: '-100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '-100%' }}
                      transition={{ type: 'spring', damping: 24, stiffness: 180 }}
                      className="absolute inset-x-0 top-7 h-52 bg-[#121318] border-b-2 border-slate-700/80 z-40 p-4 shadow-2xl flex flex-col justify-between"
                    >
                      <div>
                        {/* Summary and quick indicators */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Quick Developer Options</span>
                          <button 
                            onClick={() => setShowNotificationShade(false)}
                            className="text-[9px] text-gray-400 bg-gray-800 px-1.5 rounded"
                          >
                            Close
                          </button>
                        </div>

                        {/* Interactive toggle block grids */}
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setCudaMode(!cudaMode)}
                            className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                              cudaMode
                                ? 'bg-[#1E2D18] border-[#76B900] text-[#76B900]'
                                : 'bg-[#1E222B] border-[#2E3440] text-gray-500'
                            }`}
                          >
                            <Zap className="w-4 h-4" />
                            <span className="text-[9px] font-bold">NVIDIA CUDA</span>
                          </button>

                          <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                              soundEnabled
                                ? 'bg-indigo-900/40 border-indigo-500 text-indigo-400'
                                : 'bg-[#1E222B] border-[#2E3440] text-gray-500'
                            }`}
                          >
                            <Volume2 className="w-4 h-4" />
                            <span className="text-[9px] font-bold">Vibrate/Snd</span>
                          </button>

                          <button
                            onClick={() => {
                              onScreenChange('labs');
                              setShowNotificationShade(false);
                            }}
                            className="p-2 bg-[#1E222B] hover:bg-[#2A2E3D] border border-[#2E3440] text-gray-300 rounded-lg text-center flex flex-col items-center justify-center gap-1"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-[9px] font-bold">Inference settings</span>
                          </button>
                        </div>
                      </div>

                      {/* Diagnostic logs strip */}
                      <div className="text-[9px] font-mono text-[#D8DEE9] flex justify-between bg-[#1A1C30]/45 p-1 px-2 rounded">
                        <span>LATENCY_TRACK: OPTIMIZED</span>
                        <span className="text-emerald-400">STATUS: ACTIVE</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* PRIMARY VIEWPORTS AND CHANNELS CONTAINER */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                  {children}
                </div>

                {/* Android Bottom Soft Navigation Keys */}
                <div className="h-10 bg-black flex items-center justify-around px-8 border-t border-gray-900 shrink-0">
                  <button 
                    onClick={() => onScreenChange('chat')}
                    className="p-1 text-gray-600 hover:text-white transition-colors"
                    title="Soft Back Button"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <polygon points="19,5 5,12 19,19" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => onScreenChange('chat')}
                    className="w-3.5 h-3.5 bg-gray-600 hover:bg-white rounded-full transition-colors"
                    title="Soft Home Button"
                  />
                  <button 
                    onClick={() => onScreenChange('hub')}
                    className="w-3.5 h-3.5 border-2 border-gray-600 hover:border-white rounded transition-colors"
                    title="Soft Overview Tasks"
                  />
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
