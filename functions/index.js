const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onAttendanceWrite = onDocumentWritten(
  "attendance/{attendanceId}",
  async (event) => {
    console.log("🔥 FUNCTION TRIGGERED");

    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!after) {
      console.log("No 'after' data, exiting");
      return;
    }

    const isPunchOut = !!after?.timeOut;

    if (!isPunchOut) {
      console.log("Skipping (not punch-out)");
      return;
    }

    console.log("➡️ Punch-out detected:", after.userId);

    const userId = after.userId;

    const timeInRaw = after.timeIn;
    const timeIn =
      timeInRaw?.toDate?.() ??
      (timeInRaw ? new Date(timeInRaw) : null);

    if (!timeIn || isNaN(timeIn.getTime())) {
      console.log("❌ Invalid timeIn:", timeInRaw);
      return;
    }

    const timeOutRaw = after.timeOut;
    const timeOut =
      timeOutRaw?.toDate?.() ??
      (timeOutRaw ? new Date(timeOutRaw) : null);

    if (!timeOut || isNaN(timeOut.getTime())) {
      console.log("❌ Invalid timeOut:", timeOutRaw);
      return;
    }

    const userSnap = await admin.firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userSnap.exists) {
      console.log("❌ User not found:", userId);
      return;
    }

    const schedule = userSnap.data()?.schedule || {
      start: "09:00",
      end: "18:00"
    };

    const userTimezone =
      userSnap.data()?.timezone || "Asia/Singapore";

    function getMinutesInTimezone(date, timezone) {
      const formatter = new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      );

      const parts = formatter.formatToParts(date);

      const hour = Number(
        parts.find(p => p.type === "hour").value
      );

      const minute = Number(
        parts.find(p => p.type === "minute").value
      );

      return hour * 60 + minute;
    }

    const inMinutes =
      getMinutesInTimezone(timeIn, userTimezone);

    const outMinutes =
      getMinutesInTimezone(timeOut, userTimezone);

    function timeStringToMinutes(str) {
      const [h, m] = str.split(":").map(Number);
      return h * 60 + m;
    }

    const scheduleStart = schedule.start;
    const scheduleEnd = schedule.end;

    const startMinutes = timeStringToMinutes(scheduleStart);
    const endMinutes = timeStringToMinutes(scheduleEnd);

    const late = Math.max(0, inMinutes - startMinutes);
    const undertime = Math.max(0, endMinutes - outMinutes);
    const overtime = Math.max(0, outMinutes - endMinutes);

    const regularHours =
      Math.max(
        0,
        Math.min(outMinutes, endMinutes) -
        Math.max(inMinutes, startMinutes)
      ) / 60;

    console.log("📊 Calculations:", {
      userId,
      late,
      undertime,
      overtime,
      regularHours
    });

    function calculateNightDiff(inMin, outMin) {
      const NIGHT_START = 22 * 60;
      const NIGHT_END = 6 * 60;

      let total = 0;
      let current = inMin;

      while (current !== outMin) {
        const m = current % (24 * 60);

        if (m >= NIGHT_START || m < NIGHT_END) {
          total++;
        }

        current = (current + 1) % (24 * 60);

        if (current === inMin) break;
      }

      return total / 60;
    }

    const nightDiff = calculateNightDiff(inMinutes, outMinutes);

    const db = admin.firestore();

    const workDate = timeIn.toISOString().split("T")[0];

    console.log("💾 Writing dailySummary:", {
      userId,
      workDate
    });

    try {
      await db
        .collection("dailySummary")
        .doc(`${userId}_${workDate}`)
        .set(
          {
            userId,
            date: workDate,
            regularHours,
            overtime,
            nightDiff,
            late,
            undertime,
            createdAt: new Date(),
          },
          { merge: true }
        );

      console.log("✅ dailySummary WRITE SUCCESS");
    } catch (err) {
      console.error("❌ Firestore write failed:", err);
    }
  }
);