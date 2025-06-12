import React, { useState } from 'react';
import '../App.css';

export const PayContactDialog = ({ open, onClose, onConfirm, selectedContact }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  React.useEffect(() => {
    if (open) {
      setStep(1);
      setAmount('');
      setPin('');
      setConfirmed(false);
    }
  }, [open]);

  const handleNext = () => {
    if (step === 1 && amount && !isNaN(amount) && Number(amount) > 0) setStep(2);
    else if (step === 2 && pin) setStep(3);
  };
  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirm(selectedContact, Number(amount));
      setStep(1); setAmount(''); setPin(''); setConfirmed(false);
    }, 1200);
  };
  const handleClose = () => {
    setStep(1); setAmount(''); setPin(''); setConfirmed(false); onClose();
  };

  return (
    <div className="pay-dialog-overlay">
      <div className="pay-dialog">
        {confirmed ? (
          <>
            <div className="pay-dialog-confirmed-icon"><span role="img" aria-label="success">✔️</span></div>
            <h4 className="pay-dialog-confirmed-title">Payment Confirmed!</h4>
            <div className="pay-dialog-confirmed-summary">
              <div><b>Contact:</b> {selectedContact}</div>
              <div><b>Amount Sent:</b> ${amount}</div>
            </div>
            <div className="pay-dialog-confirmed-message">The payment has been sent to <b>{selectedContact}</b>.</div>
            <button className="pay-dialog-btn" onClick={handleClose}>Close</button>
          </>
        ) : (
          <>
            <h4>Pay {selectedContact}</h4>
            {step === 1 && (
              <>
                <label>Enter Amount</label>
                <input className="pay-dialog-input" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" autoFocus />
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn next" onClick={handleNext} disabled={!amount || isNaN(amount) || Number(amount) <= 0}>Next</button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <label>Enter PIN</label>
                <input className="pay-dialog-input" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" autoFocus />
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn next" onClick={handleNext} disabled={!pin}>Next</button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <div className="pay-dialog-summary">
                  <div><b>Contact:</b> {selectedContact}</div>
                  <div><b>Amount:</b> ${amount}</div>
                </div>
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn confirm" onClick={handleConfirm}>Confirm</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const PayUpiDialog = ({ open, onClose, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [upi, setUpi] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;
  const handleNext = () => {
    if (step === 1 && upi) setStep(2);
    else if (step === 2 && amount && !isNaN(amount) && Number(amount) > 0) setStep(3);
    else if (step === 3 && pin) setStep(4);
  };
  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirm(upi, Number(amount));
      setStep(1); setUpi(''); setAmount(''); setPin(''); setConfirmed(false);
    }, 1200);
  };
  const handleClose = () => {
    setStep(1); setUpi(''); setAmount(''); setPin(''); setConfirmed(false); onClose();
  };
  return (
    <div className="pay-dialog-overlay">
      <div className="pay-dialog">
        {confirmed ? (
          <>
            <div className="pay-dialog-confirmed-icon"><span role="img" aria-label="success">✔️</span></div>
            <h4 className="pay-dialog-confirmed-title">Payment Confirmed!</h4>
            <div className="pay-dialog-confirmed-summary">
              <div><b>UPI ID:</b> {upi}</div>
              <div><b>Amount Sent:</b> ${amount}</div>
            </div>
            <div className="pay-dialog-confirmed-message">The payment has been sent to <b>{upi}</b>.</div>
            <button className="pay-dialog-btn" onClick={handleClose}>Close</button>
          </>
        ) : (
          <>
            <h4>Pay UPI ID</h4>
            {step === 1 && (
              <>
                <label>Enter UPI ID</label>
                <input className="pay-dialog-input" value={upi} onChange={e => setUpi(e.target.value)} placeholder="UPI ID" autoFocus />
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn next" onClick={handleNext} disabled={!upi}>Next</button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <label>Enter Amount</label>
                <input className="pay-dialog-input" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" autoFocus />
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn next" onClick={handleNext} disabled={!amount || isNaN(amount) || Number(amount) <= 0}>Next</button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <label>Enter PIN</label>
                <input className="pay-dialog-input" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" autoFocus />
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn next" onClick={handleNext} disabled={!pin}>Next</button>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <div className="pay-dialog-summary">
                  <div><b>UPI ID:</b> {upi}</div>
                  <div><b>Amount:</b> ${amount}</div>
                </div>
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn confirm" onClick={handleConfirm}>Confirm</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const PayPhoneDialog = ({ open, onClose, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;
  const handleNext = () => {
    if (step === 1 && phone) setStep(2);
    else if (step === 2 && amount && !isNaN(amount) && Number(amount) > 0) setStep(3);
    else if (step === 3 && pin) setStep(4);
  };
  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirm(phone, Number(amount));
      setStep(1); setPhone(''); setAmount(''); setPin(''); setConfirmed(false);
    }, 1200);
  };
  const handleClose = () => {
    setStep(1); setPhone(''); setAmount(''); setPin(''); setConfirmed(false); onClose();
  };
  return (
    <div className="pay-dialog-overlay">
      <div className="pay-dialog">
        {confirmed ? (
          <>
            <div className="pay-dialog-confirmed-icon"><span role="img" aria-label="success">✔️</span></div>
            <h4 className="pay-dialog-confirmed-title">Payment Confirmed!</h4>
            <div className="pay-dialog-confirmed-summary">
              <div><b>Phone:</b> {phone}</div>
              <div><b>Amount Sent:</b> ${amount}</div>
            </div>
            <div className="pay-dialog-confirmed-message">The payment has been sent to <b>{phone}</b>.</div>
            <button className="pay-dialog-btn" onClick={handleClose}>Close</button>
          </>
        ) : (
          <>
            <h4>Pay Phone Number</h4>
            {step === 1 && (
              <>
                <label>Enter Phone Number</label>
                <input className="pay-dialog-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" autoFocus />
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn next" onClick={handleNext} disabled={!phone}>Next</button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <label>Enter Amount</label>
                <input className="pay-dialog-input" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" autoFocus />
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn next" onClick={handleNext} disabled={!amount || isNaN(amount) || Number(amount) <= 0}>Next</button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <label>Enter PIN</label>
                <input className="pay-dialog-input" type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" autoFocus />
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn next" onClick={handleNext} disabled={!pin}>Next</button>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <div className="pay-dialog-summary">
                  <div><b>Phone:</b> {phone}</div>
                  <div><b>Amount:</b> ${amount}</div>
                </div>
                <div className="pay-dialog-actions">
                  <button className="pay-dialog-btn cancel" onClick={handleClose}>Cancel</button>
                  <button className="pay-dialog-btn confirm" onClick={handleConfirm}>Confirm</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}; 