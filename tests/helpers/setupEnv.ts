// Runs before anything else in each test file. Nothing here is real, and the .env is never loaded.
process.env.NODE_ENV = "production"; // Plain logs: no pretty-printing worker inside Jest.
process.env.LOG_LEVEL = "silent";
process.env.TOKEN_SECRET = "test-only-secret-test-only-secret-1234";
process.env.FRONTEND_URL = "http://front";
process.env.BACKEND_URL = "http://back";
