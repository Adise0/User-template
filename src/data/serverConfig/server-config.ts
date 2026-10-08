/* eslint-disable import/prefer-default-export */
// This file contains the basic configuration parameters of the server

// USER SETTINGS

// Session settings
export const userSessionDurationInHours = 2; // Duration of the user session
export const userSessionRefreshInHours = 1; // Time before the front should refresh the token

// Password settings
export const charactersOTP = "0123456789";
export const lengthOTP = 6;
export const saltRounds = 10;

// User creation
export const userActivationExpirationInHours = 2;
