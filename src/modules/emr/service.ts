export interface EMRSubmitInput {
  token: string;
  appointmentId: string;
  patientCccd: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
}

export async function submitEMR(input: EMRSubmitInput): Promise<boolean> {
  if (!input.appointmentId || !input.symptoms || !input.diagnosis || !input.token) {
    return false;
  }

  const res = await fetch('/api/emr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify(input),
  });
  return res.ok;
}
