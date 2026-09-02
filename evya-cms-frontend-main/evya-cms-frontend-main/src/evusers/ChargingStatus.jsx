import React from 'react';

const ChargingStatus = () => {
  return (
    <div className="charging-screen">
      <div className="header">
        <h1>Charging</h1>
      </div>

      <div className="charging-info">
        <div className="power-section">
          <div className="power-value">25</div>
          <div className="power-unit">kW</div>
          <div className="power-multiplier">43x</div>
        </div>

        <div className="divider"></div>

        <div className="charging-time-section">
          <h2>Charging Time</h2>
          <div className="time-value">00:12:16 <span className="time-unit">/vozas</span></div>
          
          <div className="cost-section">
            <div className="cost-label">Cost:</div>
            <div className="cost-value">812.00 <span className="cost-unit">/zzzoo</span></div>
          </div>
        </div>

        <div className="divider"></div>

        <div className="units-section">
          <h2>Units</h2>
          <div className="units-value">12 <span className="units-unit">/zs</span></div>
          
          <div className="speed-section">
            <div className="speed-label">Speed:</div>
            <div className="speed-value">5.5 <span className="speed-unit">wm</span></div>
          </div>
        </div>

        <div className="divider"></div>

        <div className="vehicle-info">
          <h2>Tata Curvy EV</h2>
          <div className="license-plate">TS08EV9876</div>
        </div>

        <button className="stop-charging-button">
          Stop Charging
        </button>
      </div>
    </div>
  );
};

export default ChargingStatus;