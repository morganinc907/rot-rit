/**
 * Pause Status Banner
 * Shows visible kill switch status for operational awareness
 */
import { usePauseStatus } from '../hooks/usePauseStatus';

const PauseStatusBanner = () => {
  const { pauseStatus, isLoading, getStatusMessage, getSeverity } = usePauseStatus();

  if (isLoading || !pauseStatus) return null;

  // Only show banner if there are pause conditions
  if (!pauseStatus.anyPaused) return null;

  const severity = getSeverity();
  const message = getStatusMessage();

  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          background: 'linear-gradient(90deg, #dc2626, #ef4444)',
          color: 'white',
          icon: '🚨',
          pulse: true
        };
      case 'high':
        return {
          background: 'linear-gradient(90deg, #ea580c, #f97316)',
          color: 'white',
          icon: '⚠️',
          pulse: true
        };
      case 'medium':
        return {
          background: 'linear-gradient(90deg, #d97706, #f59e0b)',
          color: 'white',
          icon: '⏸️',
          pulse: false
        };
      default:
        return {
          background: 'linear-gradient(90deg, #0891b2, #06b6d4)',
          color: 'white',
          icon: 'ℹ️',
          pulse: false
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div
      style={{
        background: styles.background,
        color: styles.color,
        padding: '12px 20px',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: '14px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        animation: styles.pulse ? 'pausePulse 2s infinite' : 'none'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '8px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <span style={{ fontSize: '16px' }}>{styles.icon}</span>
        <span>PAUSE STATUS:</span>
        <span style={{ fontWeight: '700', textTransform: 'uppercase' }}>
          {message}
        </span>
        {pauseStatus.allPaused && (
          <span style={{ 
            fontSize: '12px', 
            opacity: 0.9,
            marginLeft: '8px'
          }}>
            • Emergency Mode Active
          </span>
        )}
      </div>

      <style jsx>{`
        @keyframes pausePulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default PauseStatusBanner;