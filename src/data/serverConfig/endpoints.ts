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
};

export const healthEndpoints = <const>{
  path: "/health",
};

// This is the root router containing all other routers
export const endpoints = <const>{
  health: healthEndpoints,
  auth: authEndpoints,
  users: userEndpoints,
  admin: adminEndpoints,
};
