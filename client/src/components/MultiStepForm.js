// client/src/components/MultiStepForm.js

import React, { useState } from 'react';
import PasswordPrompt from './PasswordPrompt';
import PersonalInfoForm from './PersonalInfoForm';
import ReceiptDetailsForm from './ReceiptDetailsForm';
// import AdditionalFilesForm from './AdditionalFilesForm';
import PaymentInfoForm from './PaymentInfoForm';
import FinalizeForm from './FinalizeForm';
import axios from 'axios';
import { useCookies } from 'react-cookie';

function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [personalInfo, setPersonalInfo] = useState({});
  const [receipts, setReceipts] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState({});
  const [, , removeCookie] = useCookies(['personalInfo', 'receipts', 'paymentInfo']);

  const handlePasswordSuccess = () => {
    setStep(1);
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

  // Unified Finalize Handler
  const handleFinalize = async (action) => {
    try {
      // Create FormData
      const formData = new FormData();

      // Append personalInfo
      formData.append('personalInfo', JSON.stringify(personalInfo));
      formData.append('paymentInfo', JSON.stringify(paymentInfo));
      formData.append('receipts', JSON.stringify(receipts));

      // Append files from receipts
      receipts.forEach((receipt, index) => {
        if (receipt.file) {
          formData.append('files', receipt.file); // 'files' is the field name expected by the server
        }
      });

      // Append action
      formData.append('action', action);

      // Log FormData entries for debugging
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`${pair[0]}: [File] ${pair[1].name}`);
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      }

      if (action === 'preview') {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/receipts/process`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob', // Important for handling PDF
        });

        // Create a URL for the PDF Blob
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
      } else if (action === 'finalize') {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/receipts/process`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        alert(response.data.message);
        handleReset();
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      alert(`Ett fel inträffade under ${action}. Försök igen.`);
    }
  };

  const handleBack = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setStep(0); // Reset to the first step (PasswordPrompt)
    setPersonalInfo({});
    setReceipts([]);
    setPaymentInfo({});
    // Clear all cookies
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
          onBack={handleBack}
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
          paymentInfo={paymentInfo}
          setPaymentInfo={setPaymentInfo}
          onNext={handlePaymentInfoNext}
          onBack={handleBack}
        />
      )}
      {step === 4 && (
        <FinalizeForm
          onFinalize={handleFinalize}
          onBack={handleBack}
          onReset={handleReset} // Pass handleReset to FinalizeForm
        />
      )}
    </div>
  );
}

export default MultiStepForm;
