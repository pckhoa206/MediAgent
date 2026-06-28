'use client';

import React, { useState, useEffect } from 'react';
import SpeechToTextRecorder from './SpeechToTextRecorder';
import { clearEMRDraft, loadEMRDraft, saveEMRDraft } from '../../services/emrStorage';

interface EMRFormProps {
  activePatient: {
    id: string;
    patientName: string;
    patientCccd: string;
    department: string;
  } | null;
  onComplete: (appointmentId: string) => void;
}

export default function EMRForm({ activePatient, onComplete }: EMRFormProps) {
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load draft on mount
  useEffect(() => {
    const saved = loadEMRDraft();
    if (saved && !activePatient) {
      setSymptoms(saved.symptoms);
      setDiagnosis(saved.diagnosis);
      setPrescription(saved.prescription);
    }
  }, [activePatient]);

  // Auto-fill when active patient is selected
  useEffect(() => {
    if (activePatient) {
      setSymptoms(`Bệnh nhân ${activePatient.patientName} (CCCD: ${activePatient.patientCccd}) đến khám chuyên khoa ${activePatient.department}. `);
      setDiagnosis('');
      setPrescription('');
    }
  }, [activePatient]);

  // Debounced auto-save for draft
  useEffect(() => {
    if (!symptoms && !diagnosis && !prescription) return;
    
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
    <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-900 shadow-xl text-slate-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest font-sans">Electronic Medical Record (EMR)</h2>
        <div className="text-sm text-slate-500 flex items-center space-x-2">
          {isSaving ? (
            <span className="text-indigo-400 animate-pulse text-xs">Saving draft...</span>
          ) : lastSaved ? (
            <span className="text-emerald-400 text-xs">Saved: {lastSaved.toLocaleTimeString()}</span>
          ) : null}
        </div>
      </div>

      {activePatient && (
        <div className="mb-6 p-4 bg-teal-950/30 border border-teal-500/20 rounded-xl text-xs text-teal-400 font-sans space-y-1">
          <p className="font-bold uppercase tracking-wider text-[10px] text-teal-500">Đang thực hiện chẩn đoán cho:</p>
          <p><span className="font-semibold text-slate-400">Bệnh nhân:</span> {activePatient.patientName} (CCCD: {activePatient.patientCccd})</p>
          <p><span className="font-semibold text-slate-400">Chuyên khoa:</span> {activePatient.department}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <label htmlFor="symptomsText" className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Symptoms</label>
            <SpeechToTextRecorder onResult={(text) => handleSpeechResult('symptoms', text)} />
          </div>
          <textarea 
            id="symptomsText"
            className="w-full border border-slate-800 bg-slate-900/40 rounded-xl p-3 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 outline-none text-slate-200"
            placeholder="Enter symptoms..."
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label htmlFor="diagnosisText" className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Diagnosis</label>
            <SpeechToTextRecorder onResult={(text) => handleSpeechResult('diagnosis', text)} />
          </div>
          <textarea 
            id="diagnosisText"
            className="w-full border border-slate-800 bg-slate-900/40 rounded-xl p-3 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 outline-none text-slate-200"
            placeholder="Enter diagnosis..."
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label htmlFor="prescriptionText" className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Prescription</label>
            <SpeechToTextRecorder onResult={(text) => handleSpeechResult('prescription', text)} />
          </div>
          <textarea 
            id="prescriptionText"
            className="w-full border border-slate-800 bg-slate-900/40 rounded-xl p-3 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 outline-none text-slate-200"
            placeholder="Enter prescription..."
            value={prescription}
            onChange={e => setPrescription(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-3 px-8 rounded-xl transition-all shadow"
          onClick={() => {
            if (!symptoms.trim() || !diagnosis.trim()) {
              window.alert('Vui lòng nhập đầy đủ Symptoms và Diagnosis trước khi hoàn tất.');
              return;
            }

            const draft = {
              symptoms,
              diagnosis,
              prescription,
              updatedAt: Date.now(),
            };
            saveEMRDraft(draft);
            clearEMRDraft();
            setLastSaved(new Date());
            window.alert('Hồ sơ bệnh án EMR đã được lưu thành công!');
            
            if (activePatient) {
              onComplete(activePatient.id);
            }
            
            // Reset local states
            setSymptoms('');
            setDiagnosis('');
            setPrescription('');
          }}
        >
          Complete & Save EMR
        </button>
      </div>
    </div>
  );
}

