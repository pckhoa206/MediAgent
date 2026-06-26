'use client';

import React, { useState, useEffect } from 'react';
import SpeechToTextRecorder from './SpeechToTextRecorder';
import { clearEMRDraft, loadEMRDraft, saveEMRDraft } from '../../services/emrStorage';

export default function EMRForm() {
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const saved = loadEMRDraft();
    if (saved) {
      setSymptoms(saved.symptoms);
      setDiagnosis(saved.diagnosis);
      setPrescription(saved.prescription);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSaving(true);
      const draft = {
        symptoms,
        diagnosis,
        prescription,
        updatedAt: Date.now(),
      };
      saveEMRDraft(draft);

      window.setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 500);
    }, 1200);

    return () => clearTimeout(timer);
  }, [symptoms, diagnosis, prescription]);

  const handleSpeechResult = (field: 'symptoms' | 'diagnosis' | 'prescription', text: string) => {
    if (field === 'symptoms') setSymptoms(prev => prev ? prev + ' ' + text : text);
    if (field === 'diagnosis') setDiagnosis(prev => prev ? prev + ' ' + text : text);
    if (field === 'prescription') setPrescription(prev => prev ? prev + ' ' + text : text);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Electronic Medical Record (EMR)</h2>
        <div className="text-sm text-gray-500 flex items-center space-x-2">
          {isSaving ? (
            <span className="text-blue-500 animate-pulse">Saving draft...</span>
          ) : lastSaved ? (
            <span className="text-green-600">Saved: {lastSaved.toLocaleTimeString()}</span>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-gray-700">Symptoms</label>
            <SpeechToTextRecorder onResult={(text) => handleSpeechResult('symptoms', text)} />
          </div>
          <textarea 
            className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="Enter symptoms..."
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
            <SpeechToTextRecorder onResult={(text) => handleSpeechResult('diagnosis', text)} />
          </div>
          <textarea 
            className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="Enter diagnosis..."
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-medium text-gray-700">Prescription</label>
            <SpeechToTextRecorder onResult={(text) => handleSpeechResult('prescription', text)} />
          </div>
          <textarea 
            className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="Enter prescription..."
            value={prescription}
            onChange={e => setPrescription(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-8 rounded-lg transition-colors"
          onClick={() => {
            const draft = {
              symptoms,
              diagnosis,
              prescription,
              updatedAt: Date.now(),
            };
            saveEMRDraft(draft);
            clearEMRDraft();
            setLastSaved(new Date());
            window.alert('EMR has been successfully saved!');
          }}
        >
          Complete & Save EMR
        </button>
      </div>
    </div>
  );
}
