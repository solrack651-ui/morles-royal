import React from "react";
import "./mobile-controls.css";

export default function MobileControls({ onStart, onEnd, visible }) {
  if (!visible) return null;

  return (
    <div className="mobile-controls">
      <div className="dpad">
        <button className="btn up" onTouchStart={() => onStart("forward")} onTouchEnd={() => onEnd("forward")}>▲</button>

        <div className="middle-row">
          <button className="btn left" onTouchStart={() => onStart("left")} onTouchEnd={() => onEnd("left")}>◀</button>
          <div className="center" />
          <button className="btn right" onTouchStart={() => onStart("right")} onTouchEnd={() => onEnd("right")}>▶</button>
        </div>

        <button className="btn down" onTouchStart={() => onStart("backward")} onTouchEnd={() => onEnd("backward")}>▼</button>
      </div>
    </div>
  );
}
