import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfZO2Ctj62iqsd1pYky-hLr-QEy_w4mTA",
  authDomain: "mini-hcm-5de49.firebaseapp.com",
  projectId: "mini-hcm-5de49",
  storageBucket: "mini-hcm-5de49.firebasestorage.app",
  messagingSenderId: "183077903750",
  appId: "1:183077903750:web:c371bea473894402f9e007",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
