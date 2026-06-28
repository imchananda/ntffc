/**
 * NamtanFilm FanCon Survey & Seating System - Backend API
 * Database: Google Sheets (3 Tabs: Responses, Seats_Day1, Seats_Day2)
 * Deploy as a Web App in Google Apps Script (GAS)
 */

const ROW_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T"];
const SEATS_PER_ROW = 194; // 18 * 194 = 3,492 seats exactly
const CAPACITY = ROW_NAMES.length * SEATS_PER_ROW;

function doGet(e) {
  const params = e.parameter;
  const action = params.action || "getStats";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initialize sheets if they do not exist
  checkAndInitialize(ss);

  if (action === "setup") {
    try {
      resetDatabase(ss);
      return jsonResponse({ success: true, message: "ระบบฐานข้อมูลและผังที่นั่งได้รับการจำลองเรียบร้อยแล้ว!" });
    } catch (err) {
      return jsonResponse({ success: false, error: err.toString() });
    }
  }

  if (action === "getStats") {
    try {
      const stats = calculateStats(ss);
      return jsonResponse({ success: true, stats: stats });
    } catch (err) {
      return jsonResponse({ success: false, error: err.toString() });
    }
  }

  return jsonResponse({ success: false, error: "ไม่พบคำสั่งนี้ (Action not found)" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Acquire lock to prevent race conditions during seat assignment (wait up to 30s)
    lock.waitLock(30000);
  } catch (err) {
    return jsonResponse({ success: false, status: "error", message: "ระบบหนาแน่นชั่วคราว กรุณาลองใหม่อีกครั้งในภายหลัง" });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    checkAndInitialize(ss);

    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonResponse({ success: false, status: "error", message: "รูปแบบข้อมูลไม่ถูกต้อง (Invalid JSON format)" });
    }

    const email = (data.email || "").trim().toLowerCase();
    const name = (data.name || "").trim();
    const attending = (data.attending || data.willAttend || "").trim();
    const origin = (data.origin || "").trim();
    const dayPreference = (data.dayPreference || data.attendDays || "").trim();
    const priceDay1 = (data.priceDay1 || data.priceD1 || "").trim();
    const priceDay2 = (data.priceDay2 || data.priceD2 || "").trim();
    const comments = (data.comments || "").trim();

    // Basic validation
    if (!email || !name || !attending || !origin) {
      return jsonResponse({ success: false, status: "error", message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" });
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ success: false, status: "error", message: "รูปแบบอีเมลไม่ถูกต้อง หรือใช้อีเมลโฮสต์จำลอง" });
    }

    const responsesSheet = ss.getSheetByName("Responses");
    let emailList = [];
    if (responsesSheet.getLastRow() > 1) {
      const emailsRange = responsesSheet.getRange(2, 2, responsesSheet.getLastRow() - 1, 1).getValues();
      emailList = emailsRange.map(row => String(row[0]).toLowerCase());
    }

    if (emailList.includes(email)) {
      return jsonResponse({ success: false, status: "error", message: "อีเมลนี้ได้ทำการสำรวจไปแล้ว ไม่สามารถตอบซ้ำได้" });
    }

    let seatDay1 = "";
    let seatDay2 = "";

    // Robust parsing of attendance and day preferences
    const isAttending = attending.indexOf("Definitely") !== -1 || 
                        attending.indexOf("Probably") !== -1 ||
                        attending === "Definitely" || 
                        attending === "Probably" ||
                        attending.indexOf("ไปแน่นอน") !== -1 ||
                        attending.indexOf("มีโอกาสไป") !== -1;

    const isDay1 = dayPreference.indexOf("Day 1") !== -1 || 
                   dayPreference.indexOf("วันแรก") !== -1 || 
                   dayPreference === "Both Days" || 
                   dayPreference.indexOf("ทั้งสองวัน") !== -1;

    const isDay2 = dayPreference.indexOf("Day 2") !== -1 || 
                   dayPreference.indexOf("วันที่สอง") !== -1 || 
                   dayPreference === "Both Days" || 
                   dayPreference.indexOf("ทั้งสองวัน") !== -1;

    // Seating allocation logic
    if (isAttending) {
      if (isDay1) {
        seatDay1 = allocateSeat(ss, "Seats_Day1", email);
        if (!seatDay1) {
          const waitlistNum = getWaitlistNumber(ss, 9); // Column 9 is Seat_Day1
          seatDay1 = "Waitlist-D1-" + String(waitlistNum).padStart(4, '0');
        }
      }
      if (isDay2) {
        seatDay2 = allocateSeat(ss, "Seats_Day2", email);
        if (!seatDay2) {
          const waitlistNum = getWaitlistNumber(ss, 10); // Column 10 is Seat_Day2
          seatDay2 = "Waitlist-D2-" + String(waitlistNum).padStart(4, '0');
        }
      }
    }

    // Save response
    responsesSheet.appendRow([
      new Date(),
      email,
      name,
      attending,
      origin,
      dayPreference,
      priceDay1,
      priceDay2,
      seatDay1,
      seatDay2,
      comments
    ]);

    return jsonResponse({
      success: true,
      status: "success",
      message: "บันทึกข้อมูลเรียบร้อยแล้ว!",
      seatD1: seatDay1 || "-",
      seatD2: seatDay2 || "-",
      ticket: {
        name: name,
        email: email,
        dayPreference: dayPreference,
        seatDay1: seatDay1,
        seatDay2: seatDay2,
        priceDay1: priceDay1,
        priceDay2: priceDay2
      }
    });

  } catch (err) {
    return jsonResponse({ success: false, status: "error", message: err.message || err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Get the next waitlist number by counting existing waitlisted entries in the column
 */
function getWaitlistNumber(ss, dayColIndex) {
  const sheet = ss.getSheetByName("Responses");
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  const values = sheet.getRange(2, dayColIndex, lastRow - 1, 1).getValues();
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).indexOf("Waitlist") === 0) {
      count++;
    }
  }
  return count + 1;
}

/**
 * Allocate the first available seat
 */
function allocateSeat(ss, sheetName, email) {
  const sheet = ss.getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;

  const dataRange = sheet.getRange(2, 1, lastRow - 1, 3);
  const values = dataRange.getValues();

  for (let i = 0; i < values.length; i++) {
    if (values[i][1] === "Available") {
      const seatId = values[i][0];
      // Update cell in sheet
      sheet.getRange(i + 2, 2).setValue("Booked");
      sheet.getRange(i + 2, 3).setValue(email);
      return seatId;
    }
  }
  return null;
}

/**
 * Rollback a booked seat in case of transaction failure
 */
function rollbackSeat(ss, sheetName, seatId) {
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === seatId) {
      sheet.getRange(i + 2, 2).setValue("Available");
      sheet.getRange(i + 2, 3).setValue("");
      break;
    }
  }
}

/**
 * Validate email domain
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;

  const blocklistedDomains = [
    "tempmail", "mailinator", "trashmail", "yopmail", "guerrillamail", 
    "dispostable", "getairmail", "sharklasers", "10minutemail"
  ];
  const domain = email.split("@")[1].toLowerCase();
  for (let i = 0; i < blocklistedDomains.length; i++) {
    if (domain.indexOf(blocklistedDomains[i]) !== -1) {
      return false;
    }
  }
  return true;
}

/**
 * Check sheets initialization
 */
function checkAndInitialize(ss) {
  if (!ss.getSheetByName("Responses")) {
    initializeResponsesSheet(ss);
  }
  if (!ss.getSheetByName("Seats_Day1")) {
    initializeSeatsSheet(ss, "Seats_Day1");
  }
  if (!ss.getSheetByName("Seats_Day2")) {
    initializeSeatsSheet(ss, "Seats_Day2");
  }
}

function initializeResponsesSheet(ss) {
  const sheet = ss.insertSheet("Responses");
  sheet.appendRow([
    "Timestamp", "Email", "Name", "Attending", "Origin", 
    "Day_Preference", "Price_Day1", "Price_Day2", "Seat_Day1", "Seat_Day2", "Comments"
  ]);
  sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#EAEEF3");
  sheet.setFrozenRows(1);
}

function initializeSeatsSheet(ss, sheetName) {
  const sheet = ss.insertSheet(sheetName);
  const data = [["Seat_ID", "Status", "Email_Owner"]];
  
  for (let r = 0; r < ROW_NAMES.length; r++) {
    for (let s = 1; s <= SEATS_PER_ROW; s++) {
      const seatId = ROW_NAMES[r] + "-" + String(s).padStart(3, '0');
      data.push([seatId, "Available", ""]);
    }
  }
  
  sheet.getRange(1, 1, data.length, 3).setValues(data);
  sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#EAEEF3");
  sheet.setFrozenRows(1);
}

/**
 * Clear responses and reset seat charts
 */
function resetDatabase(ss) {
  // Clear Responses Sheet
  let responsesSheet = ss.getSheetByName("Responses");
  if (responsesSheet) {
    ss.deleteSheet(responsesSheet);
  }
  initializeResponsesSheet(ss);

  // Reset Seats_Day1 Sheet
  let d1Sheet = ss.getSheetByName("Seats_Day1");
  if (d1Sheet) {
    ss.deleteSheet(d1Sheet);
  }
  initializeSeatsSheet(ss, "Seats_Day1");

  // Reset Seats_Day2 Sheet
  let d2Sheet = ss.getSheetByName("Seats_Day2");
  if (d2Sheet) {
    ss.deleteSheet(d2Sheet);
  }
  initializeSeatsSheet(ss, "Seats_Day2");
}

/**
 * Calculate dashboard and public statistics
 */
function calculateStats(ss) {
  const responsesSheet = ss.getSheetByName("Responses");
  const lastRow = responsesSheet.getLastRow();
  
  let totalResponses = 0;
  let responses = [];
  
  if (lastRow > 1) {
    totalResponses = lastRow - 1;
    responses = responsesSheet.getRange(2, 1, totalResponses, 11).getValues();
  }

  // Booked seats arrays
  const bookedD1 = getBookedSeats(ss, "Seats_Day1");
  const bookedD2 = getBookedSeats(ss, "Seats_Day2");

  // Summarize metrics
  let totalAttending = 0;
  let origins = {};
  let priceD1Demands = {};
  let priceD2Demands = {};
  let attendingDays = { "Day 1": 0, "Day 2": 0, "Both Days": 0, "Undecided": 0 };
  let recentFeedbacks = [];
  let waitlistCountD1 = 0;
  let waitlistCountD2 = 0;

  responses.forEach(row => {
    const email = row[1];
    const name = row[2];
    const attending = row[3];
    const origin = row[4];
    const dayPref = row[5];
    const pD1 = row[6];
    const pD2 = row[7];
    const seatD1 = row[8];
    const seatD2 = row[9];
    const comments = row[10];

    if (attending === "Definitely" || attending === "Probably") {
      totalAttending++;
    }

    if (seatD1 && String(seatD1).indexOf("Waitlist") === 0) {
      waitlistCountD1++;
    }
    if (seatD2 && String(seatD2).indexOf("Waitlist") === 0) {
      waitlistCountD2++;
    }

    if (origin) {
      origins[origin] = (origins[origin] || 0) + 1;
    }

    if (dayPref) {
      attendingDays[dayPref] = (attendingDays[dayPref] || 0) + 1;
    }

    if (pD1 && pD1 !== "") {
      priceD1Demands[pD1] = (priceD1Demands[pD1] || 0) + 1;
    }
    if (pD2 && pD2 !== "") {
      priceD2Demands[pD2] = (priceD2Demands[pD2] || 0) + 1;
    }

    if (comments) {
      recentFeedbacks.push({
        timestamp: row[0],
        name: name,
        email: email,
        comments: comments
      });
    }
  });

  // Limit recent feedback list to 50 items and sort by newest
  recentFeedbacks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  recentFeedbacks = recentFeedbacks.slice(0, 50);

  return {
    capacity: CAPACITY,
    totalResponses: totalResponses,
    totalAttending: totalAttending,
    bookedCountD1: bookedD1.length,
    bookedCountD2: bookedD2.length,
    d1Booked: bookedD1.length, // Compatibility
    d2Booked: bookedD2.length, // Compatibility
    waitlistCountD1: waitlistCountD1,
    waitlistCountD2: waitlistCountD2,
    bookedSeatsD1: bookedD1, // Array of booked Seat IDs
    bookedSeatsD2: bookedD2, // Array of booked Seat IDs
    origins: origins,
    attendingDays: attendingDays,
    priceD1Demands: priceD1Demands,
    priceD2Demands: priceD2Demands,
    recentFeedbacks: recentFeedbacks
  };
}

function getBookedSeats(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const booked = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i][1] === "Booked") {
      booked.push(values[i][0]);
    }
  }
  return booked;
}

/**
 * Format JSON response
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
