import { createContext, useContext, useCallback, useReducer } from 'react';

const ToastContext = createContext(null);

let nextId = 0;

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return [...state, action.toast];
    case 'remove':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const toast = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++nextId;
    dispatch({ type: 'add', toast: { id, message, type } });
    if (duration > 0) {
      setTimeout(() => dispatch({ type: 'remove', id }), duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => dispatch({ type: 'remove', id }), []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
