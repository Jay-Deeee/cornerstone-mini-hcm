import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Admin() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState({});
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const userSnap = await getDoc(
          doc(db, "users", user.uid)
        );

        const isAdminUser = userSnap.data()?.role === "admin";

        setIsAdmin(isAdminUser);
      } catch (err) {
        console.error(err);
        setIsAdmin(false);
      }
    });

    return () => unsub();
  }, []);

  if (isAdmin === null) {
    return <div>Loading...</div>;
  }

  if (isAdmin === false) {
    return <div>Unauthorized</div>;
  }

  useEffect(() => {
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

    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  return (
    <div>
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
            <tr key={record.id}>
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
    </div>
  );
}