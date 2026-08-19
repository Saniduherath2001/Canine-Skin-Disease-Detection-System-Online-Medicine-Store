module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'doggo_care_secret_key',
  FLASK_API_URL: process.env.FLASK_API_URL || 'http://127.0.0.1:5000/predict',
  PORT: process.env.PORT || 5001,
};
