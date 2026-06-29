const SHEET_NAME = "Responses"; // Change this if your sheet tab has a different name

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  try {
    const data = JSON.parse(e.postData.contents);
    const timestamp = new Date();
    const email = (data.email || "").trim().toLowerCase();
    
    // 1. ตรวจสอบอีเมลซ้ำ (Email Duplicate Check)
    let emailList = [];
    if (sheet.getLastRow() > 1) {
      const emailsRange = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
      emailList = emailsRange.map(row => String(row[0]).trim().toLowerCase());
    }
    
    if (emailList.indexOf(email) !== -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "อีเมลนี้ได้ทำการสำรวจไปแล้ว ไม่สามารถตอบซ้ำได้"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // บันทึกข้อมูลลง Google Sheet
    sheet.appendRow([
      timestamp,
      email,
      data.name,
      data.willAttend,
      data.origin,
      data.attendDays,
      data.priceD1,
      data.priceD2,
      data.comments
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data saved successfully"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({ stats: null }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 1. Map headers to column indices (Dynamic Mapping)
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  
  const colIndex = {
    timestamp: headers.indexOf("timestamp"),
    email: headers.indexOf("email"),
    name: headers.indexOf("name"),
    willAttend: headers.indexOf("attending") !== -1 ? headers.indexOf("attending") : headers.indexOf("willattend"),
    origin: headers.indexOf("origin"),
    attendDays: headers.indexOf("attend_days") !== -1 ? headers.indexOf("attend_days") : headers.indexOf("attenddays"),
    priceD1: headers.indexOf("price_day1") !== -1 ? headers.indexOf("price_day1") : headers.indexOf("priced1"),
    priceD2: headers.indexOf("price_day2") !== -1 ? headers.indexOf("price_day2") : headers.indexOf("priced2"),
    comments: headers.indexOf("comments")
  };
  
  // Fallback to default indices if headers are not found
  if (colIndex.timestamp === -1) colIndex.timestamp = 0;
  if (colIndex.email === -1) colIndex.email = 1;
  if (colIndex.name === -1) colIndex.name = 2;
  if (colIndex.willAttend === -1) colIndex.willAttend = 3;
  if (colIndex.origin === -1) colIndex.origin = 4;
  if (colIndex.attendDays === -1) colIndex.attendDays = 5;
  if (colIndex.priceD1 === -1) colIndex.priceD1 = 6;
  if (colIndex.priceD2 === -1) colIndex.priceD2 = 7;
  if (colIndex.comments === -1) colIndex.comments = 8;

  // Skip header row
  const rows = data.slice(1);
  
  const stats = {
    totalResponses: rows.length,
    totalAttending: 0,
    d1Booked: 0,
    d2Booked: 0,
    origins: {},
    attendingDays: { "Day 1": 0, "Day 2": 0, "Both Days": 0, "Undecided": 0 },
    priceD1Demands: {},
    priceD2Demands: {},
    recentFeedbacks: [],
    planCounts: { "Definitely": 0, "Probably": 0, "Not sure yet": 0 }, // นับสถิติจริงจากแผนการเข้าชม
    undecidedResponses: [], // รายชื่อคนยังไม่แน่ใจแยกเฉพาะ
    undecidedCountD1: 0, // จำนวนคนยังไม่แน่ใจแยกวัน
    undecidedCountD2: 0, // จำนวนคนยังไม่แน่ใจแยกวัน
    undecidedCountNone: 0 // จำนวนคนยังไม่แน่ใจที่ไม่ได้ระบุวัน (ข้อมูลเดิมก่อนระบบอัปเดต)
  };
  
  // Mapping Thai values back to English keys for the Dashboard Charts
  const originMap = {
    "กรุงเทพมหานคร / Bangkok": "Bangkok",
    "ปริมณฑล / Bangkok Metropolitan Area": "Bangkok Metropolitan",
    "ภาคเหนือ / Northern Thailand": "Northern",
    "ภาคกลาง / Central Thailand": "Central",
    "ภาคตะวันออก / Eastern Thailand": "Eastern",
    "ภาคตะวันออกเฉียงเหนือ / Northeastern Thailand": "Northeastern",
    "ภาคใต้ / Southern Thailand": "Southern",
    "Overseas": "Overseas"
  };
  
  // Mapping สำหรับจำนวนวันที่เข้าร่วมใหม่ และรองรับข้อมูลเดิม
  const daysMap = {
    "1 วัน / 1 Day": "Day 1",
    "2 วัน กรณีเพิ่มรอบ / 2 Days": "Both Days",
    "2 วัน กรณีเพิ่มรอบ / 2 Days (in case of an additional round)": "Both Days",
    "1 วัน": "Day 1",
    "2 วัน": "Both Days",
    "วันแรก / Day 1": "Day 1",
    "วันที่สอง / Day 2": "Day 2",
    "ทั้งสองวัน / Both Days": "Both Days",
    "ยังไม่ตัดสินใจ / Undecided": "Undecided"
  };

  rows.forEach(row => {
    const timestamp = row[colIndex.timestamp];
    const email = String(row[colIndex.email] || "").trim().toLowerCase();
    const name = row[colIndex.name];
    const willAttend = String(row[colIndex.willAttend] || "");
    const origin = String(row[colIndex.origin] || "");
    const attendDays = String(row[colIndex.attendDays] || "");
    const priceD1 = String(row[colIndex.priceD1] || "");
    const priceD2 = String(row[colIndex.priceD2] || "");
    const comments = String(row[colIndex.comments] || "");
    
    // เช็กสถานะการเข้าร่วมเพื่อทำสถิติจริงและแยกรายชื่อผู้ที่ "ยังไม่แน่ใจ"
    const isAttending = willAttend === "ไปแน่นอน / Definitely" || willAttend === "Definitely" ||
                        willAttend === "มีโอกาสไป / Probably" || willAttend === "Probably";
                        
    if (willAttend === "ไปแน่นอน / Definitely" || willAttend === "Definitely") {
      stats.totalAttending++;
      stats.planCounts["Definitely"]++;
    } else if (willAttend === "มีโอกาสไป / Probably" || willAttend === "Probably") {
      stats.totalAttending++;
      stats.planCounts["Probably"]++;
    } else {
      stats.planCounts["Not sure yet"]++;
      
      // คำนวณความต้องการวันสำหรับคนที่ยังไม่แน่ใจ
      const engDay = daysMap[attendDays] || attendDays;
      if (engDay === "Day 1" || engDay === "Both Days") {
        stats.undecidedCountD1++;
      }
      if (engDay === "Day 2" || engDay === "Both Days") {
        stats.undecidedCountD2++;
      }
      if (!engDay || engDay === "Undecided" || engDay === "") {
        stats.undecidedCountNone++;
      }

      // แยกข้อมูลเก็บไว้สำหรับไปแสดงผลในตาราง Admin หลังบ้านเฉพาะ (มีจำนวนวันและราคาเพิ่มเข้ามา)
      stats.undecidedResponses.push({
        timestamp: timestamp,
        name: name,
        email: email,
        origin: origin,
        attendDays: attendDays || "-",
        priceD1: priceD1 || "-",
        priceD2: priceD2 || "-",
        comments: comments || "-"
      });
    }
    
    // 2. Origins
    const engOrigin = originMap[origin] || origin;
    if (engOrigin) {
      stats.origins[engOrigin] = (stats.origins[engOrigin] || 0) + 1;
    }
    
    // 3. Attending Days
    const engDay = daysMap[attendDays] || attendDays;
    if (engDay && stats.attendingDays[engDay] !== undefined) {
      stats.attendingDays[engDay]++;
    }
    
    // 4. Booking Counts & Prices
    if (isAttending) {
      if (engDay === "Day 1" || engDay === "Both Days") {
        stats.d1Booked++;
      }
      if (engDay === "Day 2" || engDay === "Both Days") {
        stats.d2Booked++;
      }
    }
    
    // บันทึกความต้องการโซนราคาของทุกคน (รวมคนยังไม่แน่ใจเพื่อวัดดีมานด์)
    if (engDay === "Day 1" || engDay === "Both Days") {
      if (priceD1) {
        stats.priceD1Demands[priceD1] = (stats.priceD1Demands[priceD1] || 0) + 1;
      }
    }
    if (engDay === "Day 2" || engDay === "Both Days") {
      if (priceD2) {
        stats.priceD2Demands[priceD2] = (stats.priceD2Demands[priceD2] || 0) + 1;
      }
    }
    
    // 5. Feedbacks (Add all respondents)
    stats.recentFeedbacks.push({
      timestamp: timestamp,
      name: name,
      email: email,
      comments: comments || "-"
    });
  });
  
  // เรียงลำดับความคิดเห็นและจำกัด 50 รายการ
  stats.recentFeedbacks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  stats.recentFeedbacks = stats.recentFeedbacks.slice(0, 50);
  
  // เรียงลำดับข้อมูลผู้ยังไม่แน่ใจและจำกัด 100 รายการ
  stats.undecidedResponses.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  stats.undecidedResponses = stats.undecidedResponses.slice(0, 100);
  
  return ContentService.createTextOutput(JSON.stringify({ stats }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  // CORS Preflight handler
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
