// client/src/components/MultiStepForm.js

import React, { useEffect, useState } from 'react';
import PasswordPrompt from './PasswordPrompt';
import PersonalInfoForm from './PersonalInfoForm';
import ReceiptDetailsForm from './ReceiptDetailsForm';
import PaymentInfoForm from './PaymentInfoForm';
import FinalizeForm from './FinalizeForm';
import axios from 'axios';
import { useCookies } from 'react-cookie';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  withCredentials: true,
});

const emptyReceipt = () => ({
  date: '',
  purpose: '',
  costCenter: '',
  customCostCenter: '',
  comment: '',
  totalCost: '',
  files: [],
});

// Read the server's error message, also when the response body is a Blob
async function getErrorMessage(error, fallback) {
  let data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = null;
    }
  }
  return data?.error || fallback;
}

function MultiStepForm() {
  const [step, setStep] = useState(null); // null while checking whether we're logged in
  const [resumeStep, setResumeStep] = useState(1);
  const [personalInfo, setPersonalInfo] = useState({});
  const [receipts, setReceipts] = useState([emptyReceipt()]);
  const [paymentInfo, setPaymentInfo] = useState({});
  const [, , removeCookie] = useCookies(['personalInfo', 'receipts', 'paymentInfo']);

  // Skip the password step if the login cookie is still valid
  useEffect(() => {
    api
      .get('/api/session')
      .then((res) => setStep(res.data.authenticated ? 1 : 0))
      .catch(() => setStep(0));
  }, []);

  const handlePasswordSuccess = () => {
    setStep(resumeStep);
  };

  const handlePersonalInfoNext = (data) => {
    setPersonalInfo(data);
    setStep(2);
  };

  const handleReceiptsNext = () => {
    setStep(3);
  };

  const handlePaymentInfoNext = (data) => {
    setPaymentInfo(data);
    setStep(4);
  };

  // Unified handler for preview and sending
  const handleFinalize = async (action) => {
    const formData = new FormData();

    // Tell the server how many files belong to each receipt (without changing state)
    const receiptsToSend = receipts.map(({ files, ...rest }) => ({
      ...rest,
      filesCount: files ? files.length : 0,
    }));

    formData.append('personalInfo', JSON.stringify(personalInfo));
    formData.append('paymentInfo', JSON.stringify(paymentInfo));
    formData.append('receipts', JSON.stringify(receiptsToSend));
    formData.append('action', action);
    receipts.forEach((r) => {
      (r.files || []).forEach((file) => formData.append('files', file));
    });

    try {
      if (action === 'preview') {
        // The server returns the PDF itself; show it from memory
        const response = await api.post('/api/receipts/process', formData, {
          responseType: 'blob',
        });
        return URL.createObjectURL(response.data);
      }
      const response = await api.post('/api/receipts/process', formData);
      return response.data.message;
    } catch (error) {
      const loggedOut = error?.response?.status === 401;
      if (loggedOut) {
        // Keep everything filled in and come back here after logging in again
        alert('Du har blivit utloggad. Logga in igen så kan du fortsätta där du var.');
        setResumeStep(4);
        setStep(0);
      }
      const err = new Error(await getErrorMessage(error, 'Ett fel uppstod. Försök igen.'));
      err.handled = loggedOut;
      throw err;
    }
  };

  const handleBack = () => {
    setStep((prevStep) => Math.max(1, prevStep - 1));
  };

  const handleReset = () => {
    // Start a new submission; the login is still valid
    setResumeStep(1);
    setStep(1);
    setPersonalInfo({});
    setReceipts([emptyReceipt()]);
    setPaymentInfo({});
    removeCookie('personalInfo', { path: '/' });
    removeCookie('receipts', { path: '/' });
    removeCookie('paymentInfo', { path: '/' });
  };

  return (
    <div>
      {step === 0 && <PasswordPrompt onSuccess={handlePasswordSuccess} />}
      {step === 1 && (
        <PersonalInfoForm
          onNext={handlePersonalInfoNext}
        />
      )}
      {step === 2 && (
        <ReceiptDetailsForm
          receipts={receipts}
          setReceipts={setReceipts}
          onNext={handleReceiptsNext}
          onBack={handleBack}
        />
      )}
      {step === 3 && (
        <PaymentInfoForm
          onNext={handlePaymentInfoNext}
          onBack={handleBack}
        />
      )}
      {step === 4 && (
        <FinalizeForm
          onFinalize={handleFinalize}
          onBack={handleBack}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default MultiStepForm;
