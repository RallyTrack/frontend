import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function LoginModal({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* ✅ 여기: 모달 카드 높이 제한 + overflow */}
        <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-auto">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
