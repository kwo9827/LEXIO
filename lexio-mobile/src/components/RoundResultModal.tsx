// src/components/RoundResultModal.tsx
import type { FC } from "react";

interface RoundResultModalProps {
  visible: boolean;
  logs: string[];
  onClose: () => void;
}

const RoundResultModal: FC<RoundResultModalProps> = ({ visible, logs, onClose }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-[90%] max-w-md text-center">
        <h2 className="text-lg font-bold mb-4">🎉 라운드 종료</h2>
        <ul className="text-sm text-left mb-4">
          {logs.map((log, i) => (
            <li key={i}>• {log}</li>
          ))}
        </ul>
        <button onClick={onClose} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          다음 라운드 시작
        </button>
      </div>
    </div>
  );
};

export default RoundResultModal;
