// client/src/components/MultiStepForm.js

import React, { useState } from 'react';
import PasswordPrompt from './PasswordPrompt';
import PersonalInfoForm from './PersonalInfoForm';
import ReceiptDetailsForm from './ReceiptDetailsForm';
import AdditionalFilesForm from './AdditionalFilesForm';
import PaymentInfoForm from './PaymentInfoForm';
import FinalizeForm from './FinalizeForm';
import axios from 'axios';
import { useCookies } from 'react-cookie';

function MultiStepForm() {
  const [step, setStep] = useState(0); // Start at 0 for password prompt
  const [personalInfo, setPersonalInfo] = useState({});
  const [receipts, setReceipts] = useState([]);
  const [additionalFiles, setAdditionalFiles] = useState([]); // State for additional files
  const [paymentInfo, setPaymentInfo] = useState({});
  const [cookies, setCookie, removeCookie] = useCookies(['personalInfo', 'receipts', 'additionalFiles', 'paymentInfo']);

  const handlePasswordSuccess = () => {
    setStep(1);
  };

  const handlePersonalInfoNext = (data) => {
    setPersonalInfo(data);
    setStep(2);
  };

  const handleReceiptsNext = (data) => {
    setReceipts(data);
    setStep(3);
  };

  const handleAdditionalFilesNext = () => {
    setStep(4);
  };

  const handlePaymentInfoNext = (data) => {
    setPaymentInfo(data);
    setStep(5);
  };

  const handleFinalize = async (action) => {
    try {
      // Create FormData
      const formData = new FormData();

      // Append personalInfo
      formData.append('personalInfo[date]', personalInfo.date);
      formData.append('personalInfo[name]', personalInfo.name);

      // Append paymentInfo
      formData.append('paymentInfo[bankName]', paymentInfo.bankName);
      formData.append('paymentInfo[clearingNumber]', paymentInfo.clearingNumber);
      formData.append('paymentInfo[accountNumber]', paymentInfo.accountNumber);
      formData.append('paymentInfo[otherMethod]', paymentInfo.otherMethod);

      // Append receipts
      receipts.forEach((receipt, index) => {
        formData.append(`receipts[${index}][date]`, receipt.date);
        formData.append(`receipts[${index}][purpose]`, receipt.purpose);
        formData.append(`receipts[${index}][costCenter]`, receipt.costCenter);
        if (receipt.costCenter === 'Annat') {
          formData.append(`receipts[${index}][customCostCenter]`, receipt.customCostCenter);
        }
        formData.append(`receipts[${index}][comment]`, receipt.comment);
        formData.append(`receipts[${index}][totalCost]`, receipt.totalCost);
        formData.append(`receipts[${index}][vat]`, receipt.vat);
      });

      // Append additional files (images or PDFs)
      additionalFiles.forEach((file) => {
        formData.append('additionalFiles', file); // 'additionalFiles' is the field name
      });

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
        const response = await axios.post('http://localhost:5001/api/receipts/process', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob',
        });

        const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        return pdfUrl;
      } else if (action === 'finalize') {
        const response = await axios.post('http://localhost:5001/api/receipts/process', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        });

        return response.data;
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      throw error;
    }
  };

  // Handler to set additional files from AdditionalFilesForm
  const handleAdditionalFilesChange = (files) => {
    setAdditionalFiles(files);
  };

  const handleBack = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setStep(0); // Reset to the first step (PasswordPrompt)
    setPersonalInfo({});
    setReceipts([]);
    setAdditionalFiles([]);
    setPaymentInfo({});
    // Clear all cookies
    removeCookie('personalInfo', { path: '/' });
    removeCookie('receipts', { path: '/' });
    removeCookie('additionalFiles', { path: '/' });
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
          onNext={handleReceiptsNext}
          onBack={handleBack}
        />
      )}
      {step === 3 && (
        <AdditionalFilesForm
          onNext={handleAdditionalFilesNext}
          onBack={handleBack}
          onFilesChange={handleAdditionalFilesChange}
        />
      )}
      {step === 4 && (
        <PaymentInfoForm
          onNext={handlePaymentInfoNext}
          onBack={handleBack}
        />
      )}
      {step === 5 && (
        <FinalizeForm
          onFinalize={handleFinalize}
          onBack={handleBack}
          onReset={handleReset}  // Pass handleReset to FinalizeForm
          additionalFiles={additionalFiles} // Pass additionalFiles as prop
        />
      )}
    </div>
  );
}

export default MultiStepForm;
