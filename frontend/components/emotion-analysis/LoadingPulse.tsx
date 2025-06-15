import React from "react";

export const LoadingPulse = () => {
  return (
    <div
      className="loader"
      style={{
        height: "600px",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg
        width="400"
        height="150"
        viewBox="0 0 818 498"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="strokeGradient">
            <stop offset="5%" stopColor="#4F46E5" />
            <stop offset="60%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        <path
          className="pulse"
          d="M0 305.5H266L295.5 229.5L384 496L460 1.5L502.5 377.5L553 305.5H818"
          stroke="url(#strokeGradient)"
          strokeWidth="8"
        />
      </svg>
    </div>
  );
};
