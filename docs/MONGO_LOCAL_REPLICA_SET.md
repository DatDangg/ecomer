# MongoDB Local — Single-node Replica Set

> **Vì sao cần:** checkout (`createCheckout`) và hủy đơn (`restockAndCancel`) chạy trong
> `session.withTransaction()` (all-or-nothing — BR-CHK-010). **MongoDB standalone KHÔNG hỗ trợ
> transaction** → không có replica set thì `session.withTransaction` sẽ fail
> (`Transaction numbers are only allowed on a replica set member or mongos`).
>
> Chọn 1 trong 2:
> - **Atlas M0 (khuyến nghị):** cluster free đã là replica set → điền connection string vào `MONGODB_URI`, bỏ qua phần dưới.
> - **Local single-node replica set:** làm theo hướng dẫn này.

---

## 1. Chuẩn bị

- MongoDB Server >= 7.x (`mongod` + `mongosh`). Kiểm tra:

```bash
mongod --version
mongosh --version
```

## 2. Tạo thư mục dữ liệu + chạy `mongod` với `--replSet`

```bash
mkdir -p ~/data/mongo-rs0

mongod --replSet rs0 --dbpath ~/data/mongo-rs0 --bind_ip localhost --port 27017
# Giữ terminal này mở (chạy foreground). Thêm --fork --logpath ~/data/mongo-rs0/mongod.log nếu muốn chạy nền.
```

## 3. Khởi tạo replica set (chỉ 1 lần)

Mở terminal khác:

```bash
mongosh --port 27017
```

```js
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "localhost:27017" }]
})
```

Kỳ vọng: `{ ok: 1 }`. Sau vài giây node trở thành `PRIMARY`.

## 4. Kiểm tra `rs.status()` (lệnh xác nhận)

```js
rs.status().myState
// 1 = PRIMARY  → OK
```

Hoặc xem đầy đủ:

```js
rs.status()
// members[0].stateStr phải là "PRIMARY", health: 1
```

Nếu vẫn `STARTUP2`/`SECONDARY` chưa chuyển PRIMARY, đợi ~10 giây rồi chạy lại `rs.status()`.

## 5. Connection string

Thêm `?replicaSet=rs0` để driver (Mongoose) dùng đúng chế độ replica set:

```env
MONGODB_URI=mongodb://localhost:27017/ecommerce?replicaSet=rs0
```

> Nếu quên `?replicaSet=rs0`, driver kết nối như standalone → transaction vẫn fail dù đã `rs.initiate()`.

## 6. Xác nhận transaction chạy được

```js
mongosh "mongodb://localhost:27017/ecommerce?replicaSet=rs0"
```

```js
const session = db.getMongo().startSession();
session.startTransaction();
session.getDatabase("ecommerce").probe.insertOne({ ok: 1 });
session.commitTransaction();
session.endSession();
// Không lỗi → transaction OK. Nếu báo "Transaction numbers are only allowed..." → chưa phải replica set.
```

---

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `Transaction numbers are only allowed on a replica set member or mongos` | `mongod` chưa chạy `--replSet rs0`, hoặc chưa `rs.initiate()`, hoặc `MONGODB_URI` thiếu `?replicaSet=rs0` |
| `already initialized` khi `rs.initiate()` | Replica set đã tạo trước đó — chạy `rs.status()` để kiểm tra, không cần init lại |
| `No host described in new configuration ... maps to this node` | Tên host trong `rs.initiate` không khớp (dùng `localhost:27017`); có thể cần `rs.reconfig(...)` |
| Node mãi không lên `PRIMARY` | Sai `--dbpath` quyền ghi, hoặc port 27017 đã bị process khác chiếm (`lsof -i :27017`) |

## Reset (khi cần dựng lại từ đầu)

```bash
mongosh --port 27017 --eval 'rs.status()'   # kiểm tra
# Dừng mongod (Ctrl+C), xoá dbpath rồi chạy lại từ bước 2:
rm -rf ~/data/mongo-rs0
```

> ⚠️ Không dùng `rs.initiate()` / reset trên môi trường staging/production — đây là hướng dẫn **local dev**.
