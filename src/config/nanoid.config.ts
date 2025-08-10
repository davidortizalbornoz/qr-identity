/* eslint-disable no-undef */


export const nanoidConfig = {
  size: parseInt(process.env.NANOID_SIZE || '10'),
  alphabet: process.env.NANOID_ALPHABET || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
};
