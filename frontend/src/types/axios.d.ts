import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Đánh dấu request đã retry sau refresh để không lặp vô hạn. */
    _retry?: boolean;
    /** Bỏ qua flow refresh — dùng cho chính request `POST /auth/refresh`. */
    skipAuthRefresh?: boolean;
    /**
     * Session generation tại thời điểm request được dispatch. Dùng để phát hiện
     * request thuộc session cũ (đã logout/login tài khoản khác) khi nhận 401.
     */
    __sessionGeneration?: number;
  }
}
