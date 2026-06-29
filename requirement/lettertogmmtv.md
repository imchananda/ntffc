# 🎯 Project Name

# จดหมายถึง @GMMTV

---

# Overview

ต้องการสร้างระบบ **Floating Dynamic Text Background** สำหรับหน้าเว็บไซต์ "จดหมายถึง @GMMTV"

ระบบนี้จะดึงข้อความจริงจาก Google Sheet แล้วนำมาแสดงเป็นข้อความลอย (Floating Messages) ภายในพื้นที่ Hero Section หรือพื้นที่ที่กำหนด โดยข้อความจะลอยแบบสุ่ม มี Animation ที่สวยงาม ดูมีชีวิตชีวา คล้าย Motion Graphic ของเว็บไซต์ระดับ Premium

ผู้ใช้งานสามารถคลิกข้อความเพื่ออ่านข้อความเต็มผ่าน Popup ได้

ระบบต้องมีความลื่นไหล ทันสมัย รองรับ Responsive และไม่รบกวนการใช้งานเว็บไซต์

---

# Data Source

ใช้ Google Sheet เป็นฐานข้อมูลหลัก

ดึงข้อมูลผ่าน Google Sheets API หรือ Published CSV

ใช้ข้อมูลจากคอลัมน์

**comments**

โดยแต่ละแถวในคอลัมน์ comments ถือเป็นข้อความ 1 รายการ

ตัวอย่าง

| comments                          |
| --------------------------------- |
| ขอบคุณที่สร้างผลงานดี ๆ ให้พวกเรา |
| อยากเห็นซีรีส์แนวนี้อีก           |
| ขอให้ทุกคนมีความสุขในการทำงาน     |
| ขอบคุณสำหรับทุกความทรงจำ          |

ระบบต้องรองรับการอัปเดตข้อมูลแบบ Dynamic เมื่อ Google Sheet มีการเปลี่ยนแปลง โดยไม่ต้อง Deploy เว็บไซต์ใหม่

---

# Data Processing

ข้อความแต่ละรายการให้สร้าง Object

```json
{
  "id": "uuid",
  "shortText": "...",
  "fullText": "...",
  "createdAt": "...",
  "weight": 1
}
```

ถ้าไม่มี shortText

ระบบต้องสร้างให้อัตโนมัติ

เช่น

```
ข้อความจริง

ขอบคุณที่สร้างผลงานดี ๆ ให้กับแฟน ๆ ทุกคนเสมอมา

↓

shortText

ขอบคุณที่สร้างผลงานดี ๆ...
```

ความยาวประมาณ

24–40 ตัวอักษร

แล้วเติม

...

---

# Layout

Hero Section


↓

Floating Dynamic Messages

↓

ผังคอนเสิร์ต

---

# Floating Messages

Desktop

20–30 ข้อความ

Tablet

12–18 ข้อความ

Mobile

6–10 ข้อความ

ทุกข้อความสุ่มจาก Google Sheet

อนุญาตให้ข้อความซ้ำได้

แต่พยายามไม่ให้ข้อความเดียวกันแสดงติดกัน

---

# Smart Placement

ต้องมีระบบ Smart Placement

เพื่อป้องกันข้อความลอยไปทับพื้นที่สำคัญ

กำหนด Safe Zone เช่น

* Logo
* Hero Title
* Subtitle
* CTA Button
* Navigation
* Card
* Search Box
* Popup
* Footer (ถ้าจำเป็น)

ระบบจะสุ่มข้อความเฉพาะพื้นที่ที่ไม่ใช่ Safe Zone

Safe Zone ควรสามารถกำหนดได้จาก

* CSS Selector
* Bounding Box
* DOM Element

รองรับการ Resize หน้าจอ

เมื่อขนาดหน้าจอเปลี่ยน

ระบบต้องคำนวณ Safe Zone ใหม่

---

# Collision Avoidance

ตอนสุ่มตำแหน่ง

ให้ตรวจสอบข้อความที่มีอยู่แล้ว

กำหนด Minimum Distance

ประมาณ

80–140px

หากชน

สุ่มใหม่

จำกัด

20–30 ครั้ง

เพื่อ Performance

ไม่จำเป็นต้อง Pixel Perfect

---

# Random Properties

ทุกข้อความสุ่ม

* Position X
* Position Y
* Font Size
* Font Weight
* Rotation
* Opacity
* Animation Delay
* Animation Duration
* Layer
* Color
* Glow

---

# Animation

ทุกข้อความทำงานอิสระ

Fade In

↓

Float

↓

Hold

↓

Fade Out

↓

Replace ด้วยข้อความใหม่

Animation ของแต่ละข้อความ

ต้องไม่ตรงกัน

---

# Floating Motion

สุ่ม

* Float Up
* Float Down
* Float Left
* Float Right
* Diagonal Drift

ระยะประมาณ

5–15px

Movement ต้องดูเป็นธรรมชาติ

---

# Depth Layer

แบ่งข้อความเป็น

3 Layers

## Background Layer

* Font เล็ก
* Blur
* Opacity ต่ำ
* ความเร็วต่ำ
* Parallax ต่ำ

---

## Midground Layer

* Font กลาง
* Blur น้อย
* Opacity กลาง
* ความเร็วกลาง

---

## Foreground Layer

* Font ใหญ่
* ไม่มี Blur
* Opacity สูงกว่า
* ความเร็วมากกว่า

Layer

Background

↓

Midground

↓

Foreground

↓

Main Content

---

# Mouse Parallax

Desktop เท่านั้น

เมื่อเมาส์เคลื่อน

Background

≈2px

Midground

≈4px

Foreground

≈6–8px

ใช้

Lerp

หรือ

Smooth Easing

ปิดบน

Touch Device

---

# Highlight Messages

ประมาณ

5–10%

ของข้อความ

สุ่มให้

* ตัวใหญ่กว่า
* หนากว่า
* Glow เบา ๆ
* Opacity สูงกว่า

---

# Long Text Support

Floating Background

แสดงเฉพาะ

shortText

เช่น

```
ขอบคุณที่สร้างความสุขให้...
```

เมื่อคลิก

เปิด Popup

แสดง

fullText

ทั้งหมด

---

# Popup

เมื่อคลิกข้อความ

เปิด Modal

แสดง

Title

จดหมายถึง @GMMTV

ด้านล่าง

ข้อความเต็ม

จาก comments

ถ้ามี Link

แสดงปุ่ม

เปิดลิงก์

Animation

Fade + Scale

รองรับ

* Close Button
* Click Outside
* ESC

Popup อยู่ Layer สูงสุด

---

# Hover

Hover

* Glow
* Scale 1.03
* Opacity เพิ่ม
* Cursor Pointer

---

# Pointer Events

Container

pointer-events: none

Floating Message

pointer-events: auto

Main Content

ต้องกดได้ปกติ

---

# Theme

รองรับ Theme

Blue

Purple

Pink

White

Dark Mode

Light Mode

สีสุ่มภายใน Theme เดียวกัน

---

# Performance

ใช้

CSS Animation

หรือ

Framer Motion

หลีกเลี่ยง

Full Re-render

เปลี่ยนเฉพาะข้อความที่หมด Animation

ใช้

requestAnimationFrame

เมื่อเหมาะสม

Pause Animation

เมื่อ Tab ไม่ Active

ใช้

Intersection Observer

เพื่อเริ่ม Animation เมื่อ Hero Section อยู่ใน Viewport

เป้าหมาย

60 FPS

---

# Accessibility

รองรับ

Keyboard

ESC

ARIA

role="dialog"

Focus Trap

Screen Reader

---

# Responsive

Desktop

20–30 ข้อความ

Tablet

12–18 ข้อความ

Mobile

6–10 ข้อความ

ลด

* Font Size
* Animation Complexity

ปิด Mouse Parallax

---

# Nice to Have

* Random Rotation
* Random Font Weight
* Random Opacity
* Random Glow
* Random Drift
* Random Scale
* Seed Random ทุกครั้งที่โหลดหน้า
* Dynamic Density ตามขนาดหน้าจอ
* Soft Blur
* Glassmorphism Popup

---

# Priority Weight

รองรับการกำหนด Weight ของข้อความ

เช่น

```
{
    "comments":"...",
    "weight":5
}
```

ข้อความที่มี Weight สูง

มีโอกาสปรากฏมากกว่า

แต่ยังคงความสุ่ม

---

# Future Expand

รองรับการเพิ่ม

* Filter ตามหมวดหมู่
* Search
* Reaction (❤️ 👍 🥹)
* Favorite Message
* Share Message
* Animated Emoji
* Admin Dashboard
* Auto Refresh จาก Google Sheet
* Real-time Update

---

# Final Goal

สร้างประสบการณ์ที่เปรียบเสมือน "กำแพงแห่งจดหมายจากแฟน ๆ ถึง @GMMTV" โดยข้อความจะลอยอย่างอิสระในฉากหลัง มีความลึกและการเคลื่อนไหวที่เป็นธรรมชาติ สุ่มแสดงจาก Google Sheet คอลัมน์ `comments` พร้อม Smart Placement เพื่อไม่ให้บดบังองค์ประกอบสำคัญของหน้าเว็บ รองรับข้อความยาวด้วย Popup แสดงข้อความเต็ม และทำงานได้อย่างลื่นไหลทั้งบน Desktop, Tablet และ Mobile พร้อมคงประสิทธิภาพและความสวยงามในระดับ Production Quality.
