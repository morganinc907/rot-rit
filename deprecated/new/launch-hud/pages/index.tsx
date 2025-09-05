import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import ProgressBar from '../components/ProgressBar';
import LogStream from '../components/LogStream';
import HealthPanel from '../components/HealthPanel';
import MetricsPanel from '../components/MetricsPanel';
import QuickActions from '../components/QuickActions';
import CountdownTimer from '../components/CountdownTimer';
import { initMockSocket } from '../lib/mockSocket';
import { playSound } from '../lib/sounds';
import toast, { Toaster } from 'react-hot-toast';

// Client-side only components
const AlertSounds = dynamic(() => import('../components/AlertSounds'), { ssr: false });

export default function LaunchHUD() {
  const [logs, setLogs] = useState<Array<{time: string, msg: string, level: string}>>([]);
  const [stage, setStage] = useState<number>(0);
  const [stageStatus, setStageStatus] = useState<'pending' | 'running' | 'success' | 'failed'>('pending');
  const [metrics, setMetrics] = useState({
    txCount: 0,
    wallets: 0,
    cosmetics: 0,
    gasSpent: 0,
    successRate: 100,
  });
  const [isLive, setIsLive] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const { socket, cleanup } = initMockSocket({
      onLog: (log) => {
        setLogs(prev => [...prev.slice(-100), log]); // Keep last 100 logs
        
        // Show toast for critical events
        if (log.level === 'error') {
          toast.error(log.msg);
          playSound('error');
        } else if (log.level === 'success') {
          toast.success(log.msg);
          playSound('success');
        } else if (log.level === 'warning') {
          toast(log.msg, { icon: '⚠️' });
          playSound('warning');
        }
      },
      onStage: ({ stage, status }) => {
        setStage(stage);
        setStageStatus(status);
      },
      onMetrics: setMetrics,
      onLive: setIsLive,
    });

    socketRef.current = socket;

    return cleanup;
  }, []);

  const handleAbort = () => {
    if (confirm('Are you sure you want to ABORT the deployment?')) {
      toast.error('DEPLOYMENT ABORTED');
      playSound('error');
      socketRef.current?.emit('abort');
      setStageStatus('failed');
    }
  };

  const handleRollback = () => {
    if (confirm('Rollback to previous deployment?')) {
      toast('Rolling back...', { icon: '⏪' });
      socketRef.current?.emit('rollback');
    }
  };

  const handleScreenshot = () => {
    // In production, would use html2canvas
    toast.success('Screenshot saved to ~/Desktop/launch-hud.png');
  };

  const exportLogs = () => {
    const logText = logs.map(l => `[${l.time}] [${l.level.toUpperCase()}] ${l.msg}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-logs-${Date.now()}.txt`;
    a.click();
    toast.success('Logs exported');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Head>
        <title>Rot Ritual Launch HUD</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} p-4 transition-colors`}>
        <Toaster position="top-right" />
        <AlertSounds logs={logs} />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span className={isLive ? 'animate-pulse' : ''}>🚀</span>
              Rot Ritual Launch HUD
              {isLive && <span className="text-green-500 text-sm font-normal animate-pulse">● LIVE</span>}
            </h1>
            <p className="text-gray-400">Base {isLive ? 'Mainnet' : 'Testnet'} Deployment Control</p>
          </div>
          
          <div className="flex items-center gap-4">
            <CountdownTimer targetTime={Date.now() + 30 * 60 * 1000} />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleScreenshot}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
            >
              📸
            </button>
            <button
              onClick={exportLogs}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
            >
              Export Logs
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar stage={stage} status={stageStatus} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <LogStream logs={logs} darkMode={darkMode} />
          <HealthPanel darkMode={darkMode} />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <QuickActions 
            onAbort={handleAbort}
            onRollback={handleRollback}
            disabled={stageStatus === 'success' || stageStatus === 'failed'}
            darkMode={darkMode}
          />
          <MetricsPanel metrics={metrics} isLive={isLive} darkMode={darkMode} />
        </div>

        {/* Status Footer */}
        <div className={`mt-6 p-4 rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white shadow'
        } flex justify-between items-center`}>
          <div className="flex gap-8 text-sm">
            <span>Chain ID: {isLive ? '8453' : '84532'}</span>
            <span>Network: {isLive ? 'Base Mainnet' : 'Base Sepolia'}</span>
            <span>Gas Price: {(Math.random() * 20 + 10).toFixed(1)} gwei</span>
          </div>
          <div className="flex gap-2">
            <a 
              href="https://basescan.org" 
              target="_blank" 
              rel="noreferrer"
              className="text-blue-400 hover:underline"
            >
              BaseScan →
            </a>
            <a 
              href="https://status.base.org" 
              target="_blank" 
              rel="noreferrer"
              className="text-blue-400 hover:underline"
            >
              Network Status →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}