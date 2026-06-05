export function buildLoopbackLoginUrl(input: {
  frontendBase: string;
  baseUrl: string;
  sessionId: string;
  state: string;
}): string {
  const callback = new URL("/xagent/plugin/cli/callback", ensureTrailingSlash(input.baseUrl));
  callback.searchParams.set("flow", "loopback");
  callback.searchParams.set("sessionId", input.sessionId);
  callback.searchParams.set("state", input.state);
  return buildUserAuthUrl(input.frontendBase, callback.toString());
}

export function buildDeviceLoginUrl(input: {
  frontendBase: string;
  baseUrl: string;
  userCode: string;
}): string {
  const callback = new URL("/xagent/plugin/cli/callback", ensureTrailingSlash(input.baseUrl));
  callback.searchParams.set("flow", "device");
  callback.searchParams.set("userCode", input.userCode);
  return buildUserAuthUrl(input.frontendBase, callback.toString());
}

function buildUserAuthUrl(frontendBase: string, sourceUrl: string): string {
  const login = new URL("/userAuth", ensureTrailingSlash(frontendBase));
  login.searchParams.set("sourceApp", "x-agent");
  login.searchParams.set("sourceUrl", sourceUrl);
  return login.toString();
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
