/* This file contains all the endpoint names.
 Each constant object is a representation of a router in the program
*/

export const authEndpoints = <const>{
  path: "/auth",
  login: "/login",
  register: "/register",
  refreshToken: "/refreshToken",
  checkKeys: "/checkKeys",
};

export const userEndpoints = <const>{
  path: "/users",
  myUser: "/myUser",
  getUser: "/user/:userId",
};

// This is the root router containing all other routers
export const endpoints = <const>{
  auth: authEndpoints,
  users: userEndpoints,
};
