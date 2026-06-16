'use client';

interface ModalProps {
  title: string;
  body: React.ReactNode;
  actions: { label: string; fn: () => void; style?: 'primary' | 'secondary' | 'danger' }[];
  onClose?: () => void;
}

export function Modal({ title, body, actions, onClose }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="modal">
        <h2>{title}</h2>
        <div className="modal-body">{body}</div>
        <div className="modal-actions">
          {actions.map((a, i) => (
            <button key={i} className={`btn btn-${a.style || 'primary'}`} onClick={a.fn}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
