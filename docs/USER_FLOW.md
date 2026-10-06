# User Flow

> **Nguồn dựng:** `project-ecommerce/04-user-flow.md` + `PRODUCT_BACKLOG_ROADMAP.md` (2026-10-06, mới nhất).
> **Quy tắc áp dụng:** theo `BR-AUTH-011/012` — **không có Guest cart / Guest checkout / merge cart**; Admin **không mua, không đăng bán**.
> Một số flow cũ trong `project-ecommerce/04` còn mô tả Guest mua hàng — đã sửa ở đây (xem § 7 Ghi chú mâu thuẫn).
>
> **Vai trò:** Guest (chưa login) · Customer/Buyer · Seller (Customer có `shopName`) · Admin · System.

---

## 1. Flow tổng quát (bản đồ)

```
                 ┌─────────────── Guest ───────────────┐
                 │  xem / tìm / lọc SP, xem shop       │
                 │  bấm "Thêm giỏ"/"Đặt hàng" ─────────┼──► redirect /login
                 └─────────────────────────────────────┘
                             │ đăng nhập
                             ▼
   ┌──────────────────── Customer (đã login) ────────────────────┐
   │  giỏ DB (nhóm theo shop) → checkout (1 Checkout + N Order)   │
   │  → VNPay (1 giao dịch) → lịch sử đơn mua                     │
   └──────────────────────────────────────────────────────────────┘
                             │ thiết lập gian hàng
                             ▼
   ┌──────────────────── Seller (cùng account) ─────────────────┐
   │  đăng bán SP (Cloudinary) → quản lý SP → xử lý đơn bán       │
   │  confirmed → shipping → delivered  |  confirmed → cancelled  │
   └──────────────────────────────────────────────────────────────┘
                             │
   ┌──────────────────── Admin ──────────────────────────────────┐
   │  user ban/unban (cascade block SP) · block/unblock SP        │
   │  category CRUD · xem mọi đơn · cancelled → refunded          │
   └──────────────────────────────────────────────────────────────┘
```

---

## 2. Flow 1 — Guest: chỉ xem (không mua)

```
[Vào trang chủ /products]
      │
      ▼
[Xem danh sách SP]  — chỉ SP isActive=true và isBlocked=false
  - Lọc category · khoảng giá · tìm theo tên · sort
  - Bấm tên shop → xem SP của shop (?sellerId=)
      │
      ▼
[Xem chi tiết SP /products/:id]
  - Ảnh, tên, giá, mô tả, stock, tên shop
  - stock = 0 → badge "Hết hàng", nút thêm giỏ disabled
      │
      ▼
[Bấm "Thêm giỏ" / "Đặt hàng"]
      │
      ▼
[Redirect → /login]   ← BR-AUTH-012: không giỏ localStorage, không Guest checkout
```

**Kết thúc flow.** Guest không tạo được cart/order.

---

## 3. Flow 2 — Customer/Buyer: mua hàng

```
[Đăng ký / Đăng nhập]
  - Nhận accessToken (15m) + refreshToken (7d)
  - isActive=false → 403 "Tài khoản đã bị khóa"
      │
      ▼
[Xem SP / thêm vào giỏ DB]   (yêu cầu JWT; Admin → 403)
  - Thêm SP của chính mình → 400 "Bạn không thể mua sản phẩm của chính mình"
  - quantity ≤ stock; SP ẩn/block/hết hàng không thêm được
      │
      ▼
[Xem giỏ /cart]
  - Hiển thị NHÓM THEO SHOP (mỗi shop 1 khối + subtotal)
  - Sửa số lượng / xóa item; tổng tiền VNĐ
  - Item stock=0 hoặc SP ngừng bán → tự loại khi load lại
      │
      ▼
[Checkout /checkout]
  - Prefill recipient từ /users/me (fullName, phone, address)
  - Cho phép override địa chỉ; thiếu phone/address mà không bổ sung → 400
      │
      ▼
[POST /orders]  → (xem Flow 4)
      │
      ▼
[Redirect VNPay] → Return về /checkout/result?checkoutCode=...
  - FE KHÔNG tin ?status trên URL → gọi GET /checkouts/:checkoutCode
      │
      ▼
[Lịch sử đơn mua /orders]
  - Mỗi đơn gắn 1 shop; cùng checkoutCode nhóm hiển thị
  - Xem chi tiết (items snapshot, recipient, status, totalAmount)

[Access token hết hạn]
  - Axios interceptor → POST /auth/refresh → retry request gốc
  - Refresh fail → redirect /login
```

---

## 4. Flow 3 — Customer → Seller: đăng bán & xử lý đơn

```
[Đã đăng nhập] → "Đăng bán" / "Kênh người bán"
      │
      ├── shopName = null ? ──► [Thiết lập gian hàng /seller/setup]
      │                            ✦ shopName (3–50)  ✦ pickupAddress
      │                            (PATCH /users/me/shop — không KYC/duyệt)
      ▼
[Sản phẩm của tôi /seller/products]  (GET /products/my — gồm ẩn/bị block + lý do)
      │
      ▼
[Thêm SP /seller/products/new]
  - Tên (≤120) · category (chọn) · mô tả · giá · stock
  - Ảnh: tối đa 5, ảnh đầu = bìa (upload Cloudinary qua POST /upload/image)
  - "Lưu & Hiển thị" → SP public ngay (isActive=true, isBlocked=false)
      │
      ▼
[Quản lý SP]
  - Sửa giá/stock/mô tả/ảnh
  - Ẩn/Hiện (isActive) — SP bị Admin block thì KHÔNG tự hiện lại
  - SP người khác → 403 (ghi) / không thấy ở /my

═════════════ Khi có người mua ═════════════

[Đơn bán /seller/orders]  (GET /orders/selling)
  - Chỉ đơn có order.sellerId = mình; lọc status; đơn shop khác → 404
      │
      ▼
[Đơn mới: status = confirmed]  ← đã thanh toán VNPay
      │
      ├── [Giao hàng]    confirmed → shipping
      │        │
      │        ▼
      │   [Đã giao]      shipping → delivered   (cuối)
      │
      └── [Hủy đơn] + reason bắt buộc   confirmed → cancelled
               └── hoàn stock (đúng 1 lần)
                   └── Admin xử lý cancelled → refunded (thủ công, nếu đã paid)
```

---

## 5. Flow 4 — Checkout nhiều shop: 1 thanh toán, N đơn

```
[Giỏ có SP của Shop A và Shop B]
      │
      ▼
[POST /orders]  items = [A1, A2, B1]   (yêu cầu login; Admin → 403)
      │
      ├─ Nhóm theo sellerId
      ├─ Mỗi SP: trừ stock nguyên tử (stock >= qty, isActive, !isBlocked)
      │     └─ 1 SP không đủ/không hợp lệ → THROW → transaction abort
      │           (stock đã trừ tự quay lại, KHÔNG tạo gì) → 400
      ├─ Tạo Order(A: A1,A2) · Order(B: B1) — đều `pending`
      ├─ Tạo Checkout (gom 2 order, total = tổng, expiresAt = +30 phút)
      └─ (sau commit) Sinh vnpayUrl: vnp_TxnRef = checkoutCode, amount ×100
      │
      ▼
[Redirect → VNPay sandbox]
      │
      ├─── [THÀNH CÔNG]
      │         │
      │         ▼
      │    IPN/Return → verify HMAC-SHA512 + amount
      │    → Checkout: paid        (findOneAndUpdate điều kiện, idempotent)
      │    → Order A, B: pending → confirmed, paymentStatus = paid
      │    → Xóa item đã mua khỏi cart DB
      │    → Redirect "Đặt hàng thành công" (liệt kê N đơn)
      │
      └─── [THẤT BẠI / HỦY / HẾT HẠN 30 PHÚT]
                │
                ▼
           Checkout: failed | expired
           → Order A, B: cancelled (cancelledBy = system) + hoàn stock
           → Redirect "Thanh toán thất bại" (giữ nguyên giỏ)

[Sau confirmed — các đơn đi ĐỘC LẬP]
   Shop A: confirmed → shipping → delivered
   Shop B: confirmed → cancelled → Admin refund riêng đơn B
```

> Toàn bộ bước tạo (trừ stock + tạo Checkout + N Order) nằm trong **1 MongoDB transaction**; tạo URL VNPay **sau** commit (BR-CHK-010).

---

## 6. Flow 5 — Admin: kiểm duyệt

```
[Đăng nhập Admin]  (role = admin, seed từ ADMIN_EMAIL/PASSWORD)
      │
      ▼
[Admin Dashboard]
  ├── [Category]  /admin/categories
  │     - Tạo/Sửa/Xóa; KHÔNG xóa nếu còn SP (của bất kỳ shop) → 400
  │
  ├── [Product]   /admin/products   (GET /admin/products — mọi SP, kể cả ẩn/block)
  │     - Block SP vi phạm (reason bắt buộc) / Unblock
  │     - Sửa/ẩn bất kỳ SP (bypass ownership)
  │
  ├── [Order]     /admin/orders
  │     - Xem mọi đơn; lọc status/sellerId/userId
  │     - Cập nhật trạng thái như Seller, cộng thêm:
  │         cancelled → refunded  (CHỈ khi paymentStatus = paid)
  │     - KHÔNG hủy tay đơn `pending` (BR-STT-007)
  │
  └── [User]      /admin/users
        - Ban/Unban; ban → cascade block toàn bộ SP (blockReason = seller_banned)
        - Unban → chỉ mở lại SP có blockReason = seller_banned
        - KHÔNG tự ban chính mình → 400
```

---

## 7. Ghi chú mâu thuẫn (đã chốt theo bản mới nhất)

| Điểm | Doc cũ (`project-ecommerce/02,03,04,06,08`) | Bản mới (`BR-AUTH-011/012` + roadmap) → **đang áp dụng** |
|------|----------------------------------------------|----------------------------------------------------------|
| Giỏ Guest | localStorage, merge khi login | **Không** — giỏ chỉ cho user đăng nhập |
| Guest checkout | Cho phép, không cần tài khoản | **Không** — `POST /orders` yêu cầu login |
| `POST /cart/merge` | Có | **Không có** |
| Admin mua/bán | 06 mô tả `POST /products` = ✅ Login | Admin `POST /products` → 403; cart/order → 403 |

> Chi tiết đầy đủ xem `docs/BRD.md` § Open Questions.

---

## 8. Edge cases (tóm tắt)

| Tình huống | Xử lý |
|-----------|-------|
| SP hết hàng khi đang ở checkout | 400 + danh sách SP thiếu; không tạo đơn |
| Nhiều user mua SP cuối cùng | Atomic `stock >= qty`; người thua nhận lỗi hết hàng |
| Giỏ 3 shop, shop 3 hết hàng | Hoàn 2 shop đã trừ; không tạo gì (all-or-nothing) |
| VNPay timeout (không callback) | Cron mỗi phút: checkout pending > 30 phút → expired + hủy + hoàn stock |
| VNPay success sau khi expired | `payments.note = late_success_after_expiry`, trả `02`; Admin hoàn tiền thủ công |
| IPN và Return cùng lúc | Idempotent theo trạng thái Checkout |
| localhost không nhận IPN | Return xử lý chung hàm; hoặc dùng ngrok |
| Guest bấm "Thêm giỏ"/"Đặt hàng" | Redirect /login |
| Admin gọi thêm giỏ / order / POST products | 403 |
| Seller tự mua SP của mình | 400 ở thêm giỏ và POST /orders |
| Seller sửa giá khi SP trong giỏ người khác | Giá giỏ chỉ hiển thị; tính lại từ DB khi tạo Order |
| Seller giảm stock dưới qty trong giỏ | Áp BR-CART-003 khi load giỏ; lỗi hết hàng khi checkout |
| Seller ẩn/xóa SP đang có đơn pending/confirmed | Đơn vẫn xử lý (snapshot); SP biến khỏi public |
| Seller bị ban khi có đơn confirmed chưa giao | Đơn giữ nguyên; Admin quyết định |
| Seller cố mở lại SP Admin đã block | isActive đổi được nhưng vẫn ẩn; thấy lý do |
| Seller A sửa SP/đơn của B | 403 (ghi) / 404 (đọc "của tôi") |
| Seller đặt `refunded` | 403 — chỉ Admin |
| Thanh toán thành công — giỏ | Xóa item đã mua khỏi cart DB |
| User sửa `/checkout/result?status=success` | FE không tin; gọi `GET /checkouts/:checkoutCode` |
| Admin hủy Order pending | Không cho phép (BR-STT-007) |
| User đóng trang kết quả sau thanh toán | Xem lại "Lịch sử đơn mua" hoặc mở lại result với `checkoutCode` |
