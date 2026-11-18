const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  userEmail: {
    type: String,
    trim: true,
    default: '',
  },
  petName: {
    type: String,
    trim: true,
    default: 'Unknown',
    maxlength: [100, 'Pet name too long'],
  },
  age: {
    type: String,
    trim: true,
    default: 'Unknown',
    maxlength: [20, 'Age value too long'],
  },
  gender: {
    type: String,
    enum: { values: ['Male', 'Female', 'Unknown'], message: 'Gender must be Male, Female, or Unknown' },
    default: 'Unknown',
  },
  disease: {
    type: String,
    required: [true, 'Disease result is required'],
    trim: true,
    maxlength: [200, 'Disease name too long'],
  },
  confidence: {
    type: Number,
    required: [true, 'Confidence score is required'],
    min: [0, 'Confidence cannot be less than 0'],
    max: [1, 'Confidence cannot exceed 1'],
  },
  sortedPredictions: { type: Array,  default: [] },
  symptoms:          { type: Object, default: {} },
  careGuidelines:    { type: [String], default: [] },
  questions:         { type: Array,  default: [] },
  date:              { type: Date,   default: Date.now },
});

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
