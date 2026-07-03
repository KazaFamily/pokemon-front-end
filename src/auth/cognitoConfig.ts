export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined,
  domain: import.meta.env.VITE_COGNITO_DOMAIN as string | undefined, // e.g. "my-app.auth.us-east-1.amazoncognito.com"
  redirectUri: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
  signOutRedirectUri: `${window.location.origin}${import.meta.env.BASE_URL}`,
  scope: "openid email profile",
};

export const isCognitoConfigured = Boolean(
  cognitoConfig.userPoolId && cognitoConfig.clientId && cognitoConfig.domain,
);

export function hostedUiAuthorizeUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId!,
    response_type: "code",
    scope: cognitoConfig.scope,
    redirect_uri: cognitoConfig.redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return `https://${cognitoConfig.domain}/oauth2/authorize?${params.toString()}`;
}

export function hostedUiLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId!,
    logout_uri: cognitoConfig.signOutRedirectUri,
  });
  return `https://${cognitoConfig.domain}/logout?${params.toString()}`;
}

export function hostedUiTokenUrl(): string {
  return `https://${cognitoConfig.domain}/oauth2/token`;
}
