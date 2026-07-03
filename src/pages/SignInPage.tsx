import { useAuth } from "../auth/useAuth";

export function SignInPage() {
  const { signIn, isConfigured } = useAuth();

  return (
    <div className="page">
      <h1>Sign In</h1>
      <p className="muted">Sign in with your trainer account to create a roster or submit moves.</p>
      {isConfigured ? (
        <button type="button" onClick={() => signIn()}>
          Sign in with Cognito
        </button>
      ) : (
        <p className="error-text">
          Cognito isn't configured yet (VITE_COGNITO_* env vars are missing). Once the backend deploy provides a
          User Pool, App Client, and hosted UI domain, sign-in will work here.
        </p>
      )}
    </div>
  );
}
