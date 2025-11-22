"use client";

export default function LoginPage() {
    const handleGoogleLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}${process.env.NEXT_PUBLIC_GOOGLE_LOGIN_PATH}`;
    };

    return (
        <div className="flex justify-center items-center h-screen">
            <button
                onClick={handleGoogleLogin}
                className="bg-red-600 text-white px-4 py-2 rounded"
            >
                Google Login
            </button>
        </div>
    );
}
