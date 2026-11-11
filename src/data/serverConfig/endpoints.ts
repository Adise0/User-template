/* This file contains all the endpoint names.
 Each constant object is a representation of a router in the program
*/

export const authEndpoints = <const>{
  path: "/auth",
  login: "/login",
  register: "/register",
  refreshToken: "/refreshToken",
  checkKeys: "/checkKeys",
  activate: "/activate",
  cancelRegistration: "/cancelRegistration",
  resendActivation: "/resendActivation",
  requestOtp: "/requestOtp",
  revokeOtp: "/revokeOtp",
  requestPasswordReset: "/requestPasswordReset",
  resetPassword: "/resetPassword",
  cancelPasswordReset: "/cancelPasswordReset",
  changePassword: "/changePassword",
  logout: "/logout",
  signOutEverywhere: "/signOutEverywhere",
  requestEmailChange: "/requestEmailChange",
  confirmEmailChange: "/confirmEmailChange",
  deleteAccount: "/deleteAccount",
};

// Sign in with Google, Apple... (:provider is the provider's name, eg. "google").
export const oauthEndpoints = <const>{
  path: "/auth/oauth",
  providers: "/providers",
  completeSignup: "/completeSignup",
  authorizationUrl: "/:provider/authorizationUrl",
  callback: "/:provider/callback",
  login: "/:provider/login",
  link: "/:provider/link",
};

export const twoFactorEndpoints = <const>{
  path: "/auth/twoFactor",
  setup: "/setup",
  enable: "/enable",
  disable: "/disable",
  backupCodes: "/backupCodes",
  verify: "/verify",
};

export const userEndpoints = <const>{
  path: "/users",
  myUser: "/myUser",
};

export const adminEndpoints = <const>{
  path: "/admin",
  users: "/users",
  user: "/users/:userId",
  disableUser: "/users/:userId/disable",
  enableUser: "/users/:userId/enable",
  signOutUser: "/users/:userId/signOut",
  forcePasswordReset: "/users/:userId/forcePasswordReset",
  userRole: "/users/:userId/role",
  resetTwoFactor: "/users/:userId/resetTwoFactor",
};

export const healthEndpoints = <const>{
  path: "/health",
};

export const metricsEndpoints = <const>{
  path: "/metrics",
};

// This is the root router containing all other routers
export const endpoints = <const>{
  health: healthEndpoints,
  metrics: metricsEndpoints,
  auth: authEndpoints,
  oauth: oauthEndpoints,
  twoFactor: twoFactorEndpoints,
  users: userEndpoints,
  admin: adminEndpoints,
};
