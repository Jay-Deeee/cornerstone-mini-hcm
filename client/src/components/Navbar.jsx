import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.navbar}>
      <div style={styles.left}>
        <Link to="/admin" style={styles.link}>
          Admin
        </Link>

        <Link to="/dashboard" style={styles.link}>
          Dashboard
        </Link>
      </div>

      <div style={styles.right}>
        <button onClick={handleLogout} style={styles.button}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    background: "#111827",
    color: "white",
  },
  left: {
    display: "flex",
    gap: "16px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
  },
  right: {},
  button: {
    background: "#ef4444",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
  },
};