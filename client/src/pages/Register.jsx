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

  return (
    <div>
      <h1>Register</h1>

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

      <button onClick={handleRegister}>
        Register
      </button>
    </div>
  );
}
