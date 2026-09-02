import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import vehicleImage from '/images/vehicle.jpg'; // Update path if needed

const EvConnecting = () => {
  const [steps, setSteps] = useState([
    { text: 'Waiting for the connection', completed: false, active: false },
    { text: 'Charger is accepted', completed: false, active: false },
    { text: 'Charging is starting', completed: false, active: false }
  ]);
  const [showHelp, setShowHelp] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timers = [
      setTimeout(() => setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, active: true } : s)), 500),
      setTimeout(() => setSteps(prev => prev.map((s, i) =>
        i === 0 ? { ...s, completed: true, active: false } :
        i === 1 ? { ...s, active: true } : s)), 2000),
      setTimeout(() => setSteps(prev => prev.map((s, i) =>
        i === 1 ? { ...s, completed: true, active: false } :
        i === 2 ? { ...s, active: true } : s)), 3500),
      setTimeout(() => setSteps(prev => prev.map((s, i) =>
        i === 2 ? { ...s, completed: true, active: false } : s)), 5000),
    ];

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + 2));
    }, 50);

    const redirect = setTimeout(() => navigate('/evdashboard/connecting/evpayments'), 7000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div style={styles.container}>
      {/* <div style={{ ...styles.progressBar, width: `${progress}%` }} /> */}

      <div style={styles.statusContainer}>
        <div style={styles.chargingVisualization}>
          <img src={vehicleImage} alt="Electric Vehicle" style={styles.vehicleImage} />
        </div>

        <h1 style={styles.title}>Connect charger to your vehicle</h1>

        <div style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <div key={index} style={styles.step}>
              <div style={styles.circleContainer}>
                {step.completed ? (
                  <div style={styles.checkmark}>✓</div>
                ) : step.active ? (
                  <div style={styles.loader}></div>
                ) : (
                  <div style={styles.emptyCircle}></div>
                )}
              </div>
              <span style={{
                ...styles.stepText,
                color: step.completed ? '#4CAF50' : step.active ? '#1E88E5' : '#666',
                fontWeight: step.active ? '600' : '400'
              }}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.buttonContainer}>
        <button style={styles.helpButton} onClick={() => setShowHelp(!showHelp)}>
          Need Help
        </button>
        <button style={styles.cancelButton} onClick={() => navigate('/evdashboard')}>
          Cancel Charging
        </button>
      </div>

      {showHelp && (
        <div style={styles.helpModal}>
          <p style={styles.helpText}>
            For assistance, contact support@evcharge.com or call +1 (800) 555-CHARGE.
          </p>
          <button style={styles.closeHelpButton} onClick={() => setShowHelp(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    position: 'relative',
  },
  progressBar: {
    height: '4px',
    backgroundColor: '#4CAF50',
    position: 'absolute',
    top: 0,
    left: 0,
    transition: 'width 0.3s ease-in-out',
    zIndex: 10,
  },
  statusContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '400px',
  },
  chargingVisualization: {
    width: '100%',
    height: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '25px',
  },
  vehicleImage: {
    width: '80%',
    height: 'auto',
    objectFit: 'contain',
  },
  title: {
    fontSize: '24px',
    color: '#2E3A59',
    fontWeight: 600,
    marginBottom: '25px',
    textAlign: 'center',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    padding: '0 10px',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  circleContainer: {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '2px solid #ccc',
  },
  loader: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '2px solid #ddd',
    borderTop: '2px solid #1E88E5',
    animation: 'spin 1s linear infinite',
  },
  checkmark: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: '16px',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '20px',
  },
  helpButton: {
    padding: '14px',
    backgroundColor: '#E3F2FD',
    color: '#0D47A1',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '14px',
    backgroundColor: '#EF5350',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  helpModal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    width: '90%',
    maxWidth: '350px',
    zIndex: 1000,
  },
  helpText: {
    fontSize: '15px',
    marginBottom: '15px',
    color: '#333',
  },
  closeHelpButton: {
    padding: '10px',
    backgroundColor: '#1976D2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

// Add this to your global CSS
// @keyframes spin {
//   0% { transform: rotate(0deg); }
//   100% { transform: rotate(360deg); }
// }

export default EvConnecting;
