# Bugfix Requirements Document

## Introduction

ระบบ Notification ปัจจุบันใน `server/_core/notification.ts` ส่งการแจ้งเตือนผ่าน Manus Platform API (`WebDevService/SendNotification`) ซึ่งต้องพึ่งพา `BUILT_IN_FORGE_API_URL` และ `BUILT_IN_FORGE_API_KEY` จากภายนอก เมื่อ deploy แบบ self-hosted โดยไม่มีการเชื่อมต่อกับ Manus platform ฟังก์ชัน `notifyOwner` ใน `systemRouter` จะล้มเหลวทุกครั้ง ทั้งที่โปรเจกต์มีระบบ notifications table ใน PostgreSQL พร้อมใช้งานอยู่แล้ว (`server/routers/notifications.ts` และ `db.createNotification`)

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `notifyOwner` ถูกเรียกและ `BUILT_IN_FORGE_API_URL` ไม่ได้ถูกกำหนดค่า THEN ระบบ throw `INTERNAL_SERVER_ERROR` ว่า "Notification service URL is not configured"

1.2 WHEN `notifyOwner` ถูกเรียกและ `BUILT_IN_FORGE_API_KEY` ไม่ได้ถูกกำหนดค่า THEN ระบบ throw `INTERNAL_SERVER_ERROR` ว่า "Notification service API key is not configured"

1.3 WHEN `notifyOwner` ถูกเรียกในสภาพแวดล้อม self-hosted ที่ไม่มี Manus platform THEN ระบบส่ง HTTP request ไปยัง external API ที่ไม่มีอยู่และ return `false` (notification ไม่ถูกบันทึกที่ไหนเลย)

1.4 WHEN admin ต้องการแจ้งเตือน owner ผ่าน `system.notifyOwner` THEN การแจ้งเตือนไม่ถูก persist ในฐานข้อมูลของระบบ ทำให้ไม่มีประวัติการแจ้งเตือน

### Expected Behavior (Correct)

2.1 WHEN `notifyOwner` ถูกเรียกในสภาพแวดล้อม self-hosted (ไม่มี `BUILT_IN_FORGE_API_URL`) THEN ระบบ SHALL บันทึก notification ลงใน `notifications` table โดยตรงแทนการเรียก external API

2.2 WHEN `notifyOwner` ถูกเรียกพร้อม title และ content ที่ถูกต้อง THEN ระบบ SHALL สร้าง notification record สำหรับ user ที่มี role เป็น `admin` ทุกคนในระบบ

2.3 WHEN `notifyOwner` บันทึก notification สำเร็จ THEN ระบบ SHALL return `true` และ notification จะปรากฏใน `notifications.list` ของ admin

2.4 WHEN `notifyOwner` ถูกเรียกโดยไม่มี title หรือ content THEN ระบบ SHALL return validation error เช่นเดิม

### Unchanged Behavior (Regression Prevention)

3.1 WHEN user เรียก `notifications.list` THEN ระบบ SHALL CONTINUE TO return รายการ notifications ของ user นั้นจากฐานข้อมูลตามปกติ

3.2 WHEN user เรียก `notifications.markRead` หรือ `notifications.markAllRead` THEN ระบบ SHALL CONTINUE TO อัปเดตสถานะ `isRead` ใน `notifications` table ตามปกติ

3.3 WHEN user เรียก `notifications.unreadCount` THEN ระบบ SHALL CONTINUE TO return จำนวน notification ที่ยังไม่ได้อ่านของ user นั้นตามปกติ

3.4 WHEN ระบบสร้าง notification ผ่านช่องทางอื่น (case update, hearing reminder ฯลฯ) THEN ระบบ SHALL CONTINUE TO บันทึกและแสดงผล notification เหล่านั้นตามปกติ

---

## Bug Condition (Pseudocode)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type NotifyOwnerRequest
  OUTPUT: boolean

  // Bug เกิดเมื่อระบบถูก deploy แบบ self-hosted
  // โดยไม่มี Manus Forge API configured
  RETURN ENV.forgeApiUrl = "" OR ENV.forgeApiKey = ""
END FUNCTION
```

```pascal
// Property: Fix Checking
FOR ALL X WHERE isBugCondition(X) DO
  result ← notifyOwner'(X)
  ASSERT result = true
  AND notification EXISTS IN db.notifications WHERE title = X.title
  AND notification.userId IN (SELECT id FROM users WHERE role = "admin")
END FOR
```

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT notifyOwner(X) = notifyOwner'(X)
END FOR
```
