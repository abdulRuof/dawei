import React from "react";
import './style.css';


interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => (
  <div className={`toast ${message ? "is-visible" : ""}`}>
    {message}
  </div>
);