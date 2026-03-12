// Jest setup file
// Import testing-library extensions
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.PAYU_KEY = 'test_payu_key';
process.env.PAYU_SALT = 'test_payu_salt';
process.env.PAYU_BASE_URL = 'https://test.payu.in/_payment';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';

// Set test timeout
jest.setTimeout(10000);
