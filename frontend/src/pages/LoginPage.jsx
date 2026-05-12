import GoogleLoginButton from "../components/GoogleLoginButton";

export default function LoginPage() {

  return (
    <div className="flex items-center justify-center h-screen">

      <div className="text-center">

        <h1 className="text-3xl font-bold mb-6">
          Welcome to Zemo
        </h1>

        <GoogleLoginButton />

        <p className="mt-4 text-gray-500">
          Don't have an account? Register using Google
        </p>

      </div>

    </div>
  );
}