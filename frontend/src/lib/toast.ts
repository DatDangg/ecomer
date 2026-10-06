import "react-toastify/dist/ReactToastify.css";

import { toast, type ToastContainerProps } from "react-toastify";

/** Cấu hình chung cho `<ToastContainer />` (mount ở `App`). */
export const toastContainerProps: ToastContainerProps = {
  position: "top-right",
  autoClose: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyError(message: string): void {
  toast.error(message);
}

export { toast };
