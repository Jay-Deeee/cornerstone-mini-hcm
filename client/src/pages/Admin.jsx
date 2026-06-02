import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Admin() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState({});
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editTimeIn, setEditTimeIn] = useState("");
  const [editTimeOut, setEditTimeOut] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [dailyReports, setDailyReports] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);

  const checkAdmin = async (user) => {
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));

      setIsAdmin(userSnap.data()?.role === "admin");
    } catch (err) {
      console.error(err);
      setIsAdmin(false);
    }
  };

  const loadData = async () => {
    try {
      const [attendanceSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "attendance")),
        getDocs(collection(db, "users")),
      ]);

      const attendance = attendanceSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const usersMap = {};
      usersSnap.docs.forEach((doc) => {
        usersMap[doc.id] = doc.data();
      });

      setAttendanceRecords(attendance);
      setUsers(usersMap);
    } catch (error) {
      console.error(error);
    }
  };

  const getWeekNumber = (dateStr) => {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek);
  };

  const loadDailyReports = async () => {
    try {
      const snapshot = await getDocs(collection(db, "dailySummary"));

      const reports = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDailyReports(reports);

      const map = {};

      reports.forEach((r) => {
        const key = `${r.userId}_W${getWeekNumber(r.date)}`;

        if (!map[key]) {
          map[key] = {
            userId: r.userId,
            week: getWeekNumber(r.date),
            regularHours: 0,
            overtime: 0,
            late: 0,
            undertime: 0,
            nightDiff: 0,
          };
        }

        map[key].regularHours += r.regularHours || 0;
        map[key].overtime += r.overtime || 0;
        map[key].late += r.late || 0;
        map[key].undertime += r.undertime || 0;
        map[key].nightDiff += r.nightDiff || 0;
      });

      setWeeklyReports(Object.values(map));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      checkAdmin(user);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAdmin !== true) return;
    loadData();
    loadDailyReports();
  }, [isAdmin]);

  const isLoading = isAdmin === null;
  const isUnauthorized = isAdmin === false;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isUnauthorized) {
    return <div>Unauthorized</div>;
  }

  const openEditModal = (record) => {
    setSelectedRecord(record);

    setEditTimeIn(
      record.timeIn?.toDate().toISOString().slice(0, 16) || ""
    );

    setEditTimeOut(
      record.timeOut?.toDate().toISOString().slice(0, 16) || ""
    );

    setEditStatus(record.status || "open");
  };

  const saveEdit = async () => {
    if (!selectedRecord) return;

    try {
      await updateDoc(doc(db, "attendance", selectedRecord.id), {
        timeIn: editTimeIn ? new Date(editTimeIn) : null,
        timeOut: editTimeOut ? new Date(editTimeOut) : null,
        status: editStatus,
      });

      setSelectedRecord(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Admin Dashboard</h1>

        <h2>All Attendance Records</h2>

        <table border="1">
          <thead>
            <tr>
              <th>User</th>
              <th>Date</th>
              <th>Time In</th>
              <th>Time Out</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {attendanceRecords.map((record) => (
              <tr key={record.id} onClick={() => openEditModal(record)} style={{ cursor: "pointer" }}>
                <td>
                  <div>
                    <strong>
                      {users[record.userId]?.name || "Unknown User"}
                    </strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {users[record.userId]?.email || record.userId}
                    </div>
                  </div>
                </td>

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

      <br />

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2>Daily Summary Report</h2>

        <table border="1">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Date</th>
              <th>Regular</th>
              <th>OT</th>
              <th>Late</th>
              <th>Undertime</th>
              <th>Night Diff</th>
            </tr>
          </thead>

          <tbody>
            {dailyReports.map((report) => (
              <tr key={report.id}>
                <td>
                  <div>
                    <strong>
                      {users[report.userId]?.name || "Unknown User"}
                    </strong>

                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {users[report.userId]?.email || report.userId}
                    </div>
                  </div>
                </td>
                <td>{report.date}</td>
                <td>{(report.regularHours ?? 0).toFixed(2)}</td>
                <td>{report.overtime}</td>
                <td>{report.late}</td>
                <td>{report.undertime}</td>
                <td>{(report.nightDiff ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <br />

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2>Weekly Summary Report</h2>

        <table border="1">
          <thead>
            <tr>
              <th>User</th>
              <th>Week</th>
              <th>Regular</th>
              <th>OT</th>
              <th>Late</th>
              <th>Undertime</th>
              <th>Night Diff</th>
            </tr>
          </thead>

          <tbody>
            {weeklyReports.map((report, i) => (
              <tr key={i}>
                <td>
                  <div>
                    <strong>
                      {users[report.userId]?.name || "Unknown User"}
                    </strong>

                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {users[report.userId]?.email || report.userId}
                    </div>
                  </div>
                </td>
                <td>Week {report.week}</td>
                <td>{report.regularHours.toFixed(2)}</td>
                <td>{report.overtime}</td>
                <td>{report.late}</td>
                <td>{report.undertime}</td>
                <td>{report.nightDiff.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRecord && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 20, minWidth: 300 }}>
            <h3>Edit Attendance</h3>

            <label>Time In</label>
            <input
              type="datetime-local"
              value={editTimeIn}
              onChange={(e) => setEditTimeIn(e.target.value)}
            />

            <br />

            <label>Time Out</label>
            <input
              type="datetime-local"
              value={editTimeOut}
              onChange={(e) => setEditTimeOut(e.target.value)}
            />

            <br />

            <label>Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              <option value="open">Open</option>
              <option value="completed">Completed</option>
            </select>

            <br /><br />

            <button onClick={saveEdit}>
              Save
            </button>

            <button onClick={() => setSelectedRecord(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}