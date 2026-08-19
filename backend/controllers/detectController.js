const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const Diagnosis = require('../models/Diagnosis');
const { FLASK_API_URL } = require('../config/constants');

const CARE_GUIDELINES = {
  Ringworm: [
    'Keep the infected skin clean and dry.',
    'Prevent excessive scratching by using an Elizabethan collar if necessary.',
    'Clean the affected area using a veterinarian-approved antiseptic solution.',
    'Give prescribed anti-fungal/antibiotic treatments exactly as directed.',
    'Wash bedding, blankets, and grooming tools regularly.',
    'Schedule a veterinary follow-up if symptoms worsen.',
  ],
  ringworm: [
    'Keep the infected skin clean and dry.',
    'Prevent excessive scratching by using an Elizabethan collar if necessary.',
    'Clean the affected area using a veterinarian-approved antiseptic solution.',
    'Give prescribed anti-fungal/antibiotic treatments exactly as directed.',
    'Wash bedding, blankets, and grooming tools regularly.',
    'Schedule a veterinary follow-up if symptoms worsen.',
  ],
  Dermatitis: [
    'Avoid bathing your dog with harsh shampoos; use hypoallergenic or soothing oatmeal shampoo.',
    'Identify and eliminate potential environmental or food allergens.',
    'Prevent scratching to avoid secondary bacterial skin infections.',
    'Apply vet-prescribed soothing ointments or anti-inflammatory treatments.',
    'Keep your pet in a clean, cool, and comfortable environment.',
    'Consult your veterinarian if inflammation or redness spreads.',
  ],
  dermatitis: [
    'Avoid bathing your dog with harsh shampoos; use hypoallergenic or soothing oatmeal shampoo.',
    'Identify and eliminate potential environmental or food allergens.',
    'Prevent scratching to avoid secondary bacterial skin infections.',
    'Apply vet-prescribed soothing ointments or anti-inflammatory treatments.',
    'Keep your pet in a clean, cool, and comfortable environment.',
    'Consult your veterinarian if inflammation or redness spreads.',
  ],
  Demodicosis: [
    'Consult a veterinarian for specialized anti-parasitic / mite treatment.',
    'Maintain strict hygiene standards for bedding and sleeping areas.',
    'Boost your dog’s immune system with balanced nutrition and proper supplements.',
    'Regularly monitor bald spots, scabs, or skin lesions for changes.',
    'Keep your dog away from other stressed animals to aid recovery.',
  ],
  demodicosis: [
    'Consult a veterinarian for specialized anti-parasitic / mite treatment.',
    'Maintain strict hygiene standards for bedding and sleeping areas.',
    'Boost your dog’s immune system with balanced nutrition and proper supplements.',
    'Regularly monitor bald spots, scabs, or skin lesions for changes.',
    'Keep your dog away from other stressed animals to aid recovery.',
  ],
  Healthy: [
    'Your dog skin appears healthy! Continue regular grooming and routine care.',
    'Maintain a balanced, nutrient-dense diet and fresh water daily.',
    'Use gentle, pet-safe shampoos during routine baths.',
    'Keep up with regular veterinary checkups and vaccinations.',
  ],
  healthy: [
    'Your dog skin appears healthy! Continue regular grooming and routine care.',
    'Maintain a balanced, nutrient-dense diet and fresh water daily.',
    'Use gentle, pet-safe shampoos during routine baths.',
    'Keep up with regular veterinary checkups and vaccinations.',
  ],
};

const DEFAULT_GUIDELINES = [
  'Keep the affected area clean and monitor for changes.',
  'Consult a licensed veterinarian for a full clinical examination.',
  'Prevent your dog from biting or scratching the area.',
];

exports.detect = async (req, res) => {
  try {
    const { petName, age, gender, symptoms } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let parsedSymptoms = {};
    if (symptoms) {
      try {
        parsedSymptoms = typeof symptoms === 'string' ? JSON.parse(symptoms) : symptoms;
      } catch (e) {
        parsedSymptoms = {};
      }
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));

    // 1. Send to Flask ML Model
    const response = await axios.post(FLASK_API_URL, formData, {
      headers: formData.getHeaders(),
    });

    // Clean up temporary uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const sorted_predictions = response.data.sorted_predictions || [];
    const best_prediction = response.data.best_prediction || sorted_predictions[0] || { disease: 'Healthy', confidence: 0.95 };
    const bestDisease = (best_prediction.disease || '').toLowerCase();

    // Flask's disease_candidates already excludes "others" and "Healthy"
    const flask_disease_candidates = response.data.disease_candidates || [];

    const flaskBase = FLASK_API_URL.replace('/predict', '');
    let finalCandidates = [];

    if (bestDisease === 'healthy') {
      // Model says Healthy → send only Healthy, no questions needed
      finalCandidates = [{ disease: 'Healthy', confidence: best_prediction.confidence, questions: [] }];
    } else if (bestDisease === 'others' || bestDisease === 'notmatch' || bestDisease === 'not match') {
      // Model says others/not match → send only others, no questions needed
      finalCandidates = [{ disease: 'others', confidence: best_prediction.confidence, questions: [] }];
    } else {
      // Model says it's a disease → fetch 3 questions for each disease candidate
      for (const cand of flask_disease_candidates) {
        try {
          const qRes = await axios.post(`${flaskBase}/get_questions`, { disease: cand.disease });
          finalCandidates.push({
            disease: cand.disease,
            confidence: cand.confidence,
            questions: qRes.data.questions || [],
          });
        } catch (err) {
          console.warn(`Could not fetch questions for ${cand.disease}:`, err.message);
          finalCandidates.push({ disease: cand.disease, confidence: cand.confidence, questions: [] });
        }
      }
      // Add Healthy at the end as fallback (for when all disease questions fail)
      const healthyEntry = sorted_predictions.find(p => p.disease === 'Healthy');
      if (healthyEntry) {
        finalCandidates.push({ disease: 'Healthy', confidence: healthyEntry.confidence, questions: [] });
      }
    }

    console.log('Best prediction:', best_prediction.disease, best_prediction.confidence);
    console.log('Final candidates sent:', finalCandidates.map(c => c.disease));

    res.json({
      sorted_predictions,
      disease_candidates: finalCandidates,
      best_prediction,
      careGuidelines: CARE_GUIDELINES,
      petInfo: {
        name: petName || 'Buddy',
        age: age || 'Unknown',
        gender: gender || 'Unknown',
      },
    });
  } catch (error) {
    console.error('Detection Backend Error:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Flask AI Server unreachable or processing error' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const filter = req.userId ? { userId: req.userId } : {};
    const history = await Diagnosis.find(filter).sort({ date: -1 }).limit(20);
    res.json({ history });
  } catch (error) {
    console.error('Get History Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch diagnosis history' });
  }
};

exports.getDiagnosisById = async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id);
    if (!diagnosis) {
      return res.status(404).json({ error: 'Diagnosis record not found' });
    }
    res.json({ diagnosis });
  } catch (error) {
    console.error('Get Diagnosis Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch diagnosis record' });
  }
};

