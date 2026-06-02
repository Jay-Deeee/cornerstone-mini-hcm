import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: "employee",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        schedule: {
          start: "09:00",
          end: "18:00",
        },
        createdAt: new Date().toISOString(),
      });

      alert("Registration successful!");

      navigate("/");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleBack = async () => {
    navigate("/")
  };

  return (
    <div>
      <h2 style={{ marginTop: "50px" }}>Register</h2>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "300px", margin: "auto", padding: "100px, 50px", gap: "10px", marginBottom: "15px" }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "30px", marginBottom: "40px" }}>
        <button onClick={handleRegister} style={{ maxWidth: "100px" }}>
          Register
        </button>

        <button onClick={handleBack} style={{ maxWidth: "100px" }}>
          Back
        </button>
      </div>
    </div>
  );
}
