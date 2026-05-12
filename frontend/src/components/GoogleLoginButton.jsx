import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";

export default function GoogleLoginButton() {

  const login = async () => {

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const response = await axios.post(
      "http://localhost:5000/user/google-login",
      {
        googleId: user.uid,
        name: user.displayName,
        email: user.email,
        profilePicture: user.photoURL
      }
    );

    localStorage.setItem("user", JSON.stringify(response.data));

    window.location.href = "/";
  };

  return (
    <button
      onClick={login}
      className="bg-white px-6 py-3 rounded shadow"
    >
      Sign in with Google
    </button>
  );
}