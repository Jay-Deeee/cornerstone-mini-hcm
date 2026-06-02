import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [userData, setUserData] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

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
    if (!user) return;

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

  const loadUserData = async () => {
    if (!user) return;

    const userDoc = await getDoc(
      doc(db, "users", user.uid)
    );

    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }
  };

  const loadDailySummary = async () => {
    if (!user) return;

    const today =
      new Date().toISOString().split("T")[0];

    const summaryDoc = await getDoc(
      doc(
        db,
        "dailySummary",
        `${user.uid}_${today}`
      )
    );

    if (summaryDoc.exists()) {
      setDailySummary(summaryDoc.data());
    }
  };

  const loadAttendanceHistory = async () => {
    if (!user) return;

    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(attendanceQuery);

    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const sortedRecords = [...records].sort(
      (a, b) => b.date.localeCompare(a.date)
    );

    setAttendanceHistory(sortedRecords);
  };

  useEffect(() => {
    if (!user) return;

    loadAttendance();
    loadUserData();
    loadDailySummary();
    loadAttendanceHistory();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  const calculateMetrics = () => {
    if (!attendance || !userData) {
      return null;
    }

    const attendanceData =
      attendance.data();

    if (!attendanceData.timeOut) {
      return null;
    }

    const timeIn =
      attendanceData.timeIn.toDate();

    const timeOut =
      attendanceData.timeOut.toDate();

    return {
      timeIn,
      timeOut,
    };
  };

  const metrics = calculateMetrics();

  console.log(metrics);

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <p>
        Logged in as: {user?.email}
      </p>

      <p>
        Schedule: {userData?.schedule?.start} - {userData?.schedule?.end}
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

      {dailySummary && (
        <div>
          <h2>Today's Summary</h2>

          <p>
            Regular Hours: {(dailySummary.regularHours ?? 0).toFixed(2)} hrs
          </p>

          <p>
            Overtime: {formatMinutes(dailySummary.overtime)}
          </p>

          <p>
            Night Differential: {(dailySummary.nightDiff ?? 0).toFixed(2)} hrs
          </p>

          <p>
            Late: {formatMinutes(dailySummary.late)}
          </p>

          <p>
            Undertime: {formatMinutes(dailySummary.undertime)}
          </p>
        </div>
      )}

      <h2>Attendance History</h2>

      <table border="1">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time In</th>
            <th>Time Out</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {attendanceHistory.map((record) => (
            <tr key={record.id}>
              <td>{record.date}</td>

              <td>
                {record.timeIn
                  ?.toDate()
                  .toLocaleString()}
              </td>

              <td>
                {record.timeOut
                  ? record.timeOut
                      .toDate()
                      .toLocaleString()
                  : "--"}
              </td>

              <td>{record.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
