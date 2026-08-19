const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  petName: { type: String, default: 'Unknown' },
  age: { type: String, default: 'Unknown' },
  gender: { type: String, default: 'Unknown' },
  disease: { type: String, required: true },
  confidence: { type: Number, required: true },
  sortedPredictions: { type: Array, default: [] },
  symptoms: { type: Object, default: {} },
  careGuidelines: { type: [String], default: [] },
  questions: { type: Array, default: [] },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
