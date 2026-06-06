export const TEST_AUTO_LOGIN = import.meta.env.VITE_TEST_AUTO_LOGIN === "true";

export const TEST_USER_EMAIL = import.meta.env.VITE_TEST_USER_EMAIL ?? "";
export const TEST_USER_PASSWORD = import.meta.env.VITE_TEST_USER_PASSWORD ?? "";

export const HAS_TEST_CREDENTIALS = TEST_USER_EMAIL.length > 0 && TEST_USER_PASSWORD.length > 0;
