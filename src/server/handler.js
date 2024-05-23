const predictClassification = require('../services/inferenceService');
const crypto = require('crypto');
const storeData = require('../services/storeData');
const { Firestore } = require('@google-cloud/firestore');

async function postPredictHandler(request, h) {
  try {
    const { image } = request.payload;
    const { model } = request.server.app;

    if (!image) {
      return h.response({
        status: 'fail',
        message: 'Image is required for prediction',
      }).code(400);
    }

    const { result, suggestion } = await predictClassification(model, image);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const data = {
      id: id,
      result: result,
      suggestion: suggestion,
      createdAt: createdAt
    };

    await storeData(id, data);

    // Response ketika model berhasil diprediksi.
    return h.response({
      status: 'success',
      message: 'Model is predicted successfully',
      data: data
    }).code(201);

  } catch (error) {
    console.error('Error during prediction:', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan dalam melakukan prediksi',
    }).code(400);
  }
}

async function getHistoriesHandler(request, h) {
  try {
    const db = new Firestore();                            
    const predictCollection = db.collection('predictions'); 
    const predictSnapshot = await predictCollection.get(); 

    const data = [];

    predictSnapshot.forEach((doc) => {
      const history = {
        id: doc.id,
        history: doc.data()
      };
      // Tambahkan objek history ke array
      data.push(history);
    });

    return h.response({
      status: 'success',
      data: data
    }).code(200);

  } catch (error) {
    console.error('Error fetching histories:', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan dalam mengambil data prediksi',
    }).code(500);
  }
}

module.exports = { postPredictHandler, getHistoriesHandler };
