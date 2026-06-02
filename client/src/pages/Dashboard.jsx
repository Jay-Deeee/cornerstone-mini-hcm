import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const user = auth.currentUser;
  const [attendance, setAttendance] = useState(null);

  const handlePunchIn = async () => {
    if (!user) {
      alert("No user logged in.");
      return;
    }

    const today =
      new Date().toISOString().split("T")[0];

    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", user.uid),
      where("date", "==", today)
    );

    const snapshot =
      await getDocs(attendanceQuery);

    if (!snapshot.empty) {
      alert("Attendance record already exists for today.");
      return;
    }

    try {
      await addDoc(collection(db, "attendance"), {
        userId: user.uid,
        date: new Date().toISOString().split("T")[0],
        timeIn: new Date(),
        timeOut: null,
        status: "open",
      });

      alert("Punched In!");
    } catch (error) {
      console.error(error);
    }
  };

  const handlePunchOut = async () => {
    if (!user) {
      alert("No user logged in.");
      return;
    }

    try {
      const today =
        new Date().toISOString().split("T")[0];

      const attendanceQuery = query(
        collection(db, "attendance"),
        where("userId", "==", user.uid),
        where("date", "==", today),
        where("status", "==", "open")
      );

      const snapshot =
        await getDocs(attendanceQuery);

      if (snapshot.empty) {
        alert("No active attendance found.");
        return;
      }

      const attendanceDoc =
        snapshot.docs[0];

      await updateDoc(
        doc(db, "attendance", attendanceDoc.id),
        {
          timeOut: new Date(),
          status: "completed",
        }
      );

      alert("Punched Out!");
    } catch (error) {
      console.error(error);
    }
  };

  const loadAttendance = async () => {
    const today =
      new Date().toISOString().split("T")[0];

    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", user.uid),
      where("date", "==", today)
    );

    const snapshot =
      await getDocs(attendanceQuery);

    if (!snapshot.empty) {
      setAttendance(snapshot.docs[0]);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      <p>
        Logged in as: {user?.email}
      </p>

      <button onClick={handlePunchIn}>
        Punch In
      </button>

      <button onClick={handlePunchOut}>
        Punch Out
      </button>

      {attendance && (
        <div>
          <h2>Today's Attendance</h2>

          <p>
            Status: {attendance.data().status}
          </p>

          <p>
            Time In:{" "}
            {attendance.data().timeIn?.toDate().toLocaleString()}
          </p>

          <p>
            Time Out:{" "}
            {attendance.data().timeOut
              ? attendance.data().timeOut
                  .toDate()
                  .toLocaleString()
              : "--"}
          </p>
        </div>
      )}

    </div>
  );
}
