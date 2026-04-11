import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";

/* ─── Toast Context ─── */
const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

/* ─── Confirm Dialog ─── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="toast-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <h4 className="confirm-title">Xác nhận</h4>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-cancel" onClick={onCancel}>Hủy bỏ</button>
          <button className="confirm-btn confirm-ok" onClick={onConfirm}>Đồng ý</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast Provider ─── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirm({
        message,
        onConfirm: () => { setConfirm(null); resolve(true); },
        onCancel: () => { setConfirm(null); resolve(false); },
      });
    });
  }, []);

  const success = useCallback((msg) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg) => addToast(msg, "error"), [addToast]);
  const warning = useCallback((msg) => addToast(msg, "warning"), [addToast]);
  const info = useCallback((msg) => addToast(msg, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, showConfirm }}>
      {children}
      {/* Dùng createPortal để render toast trực tiếp vào body, tránh bị overflow:hidden che mất */}
      {createPortal(
        <div className="toast-container">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => setToasts((p) => p.filter((x) => x.id !== t.id))} />
          ))}
        </div>,
        document.body
      )}
      {/* Confirm Dialog cũng render vào body */}
      {confirm && createPortal(<ConfirmDialog {...confirm} />, document.body)}
    </ToastContext.Provider>
  );
}

/* ─── Single Toast Item ─── */
function ToastItem({ toast, onClose }) {
  const [exiting, setExiting] = useState(false);
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`toast-item toast-${toast.type} ${exiting ? "toast-exit" : ""}`} onClick={onClose}>
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}
