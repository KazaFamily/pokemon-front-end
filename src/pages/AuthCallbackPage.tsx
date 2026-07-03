import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { completeSignIn } = useAuth();
  const navigate = useNavigate();
  const [asyncError, setAsyncError] = useState<string | null>(null);
  const hasRun = useRef(false);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  const validationError = oauthError ?? (!code || !state ? "Missing authorization code from Cognito redirect." : null);

  useEffect(() => {
    if (hasRun.current || validationError || !code || !state) return;
    hasRun.current = true;

    completeSignIn(code, state)
      .then(() => navigate("/", { replace: true }))
      .catch((err) => setAsyncError(err instanceof Error ? err.message : "Sign-in failed"));
  }, [code, state, validationError, completeSignIn, navigate]);

  const error = validationError ?? asyncError;

  if (error) {
    return (
      <div className="page">
        <h1>Sign-in failed</h1>
        <p className="error-text">{error}</p>
        <button type="button" onClick={() => navigate("/sign-in")}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <p>Completing sign-in…</p>
    </div>
  );
}
