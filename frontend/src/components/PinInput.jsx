/**
 * PinInput — Reusable 4-digit PIN input component
 * Used in Login, SetPIN, and payment confirmation
 */
import { useState, useRef, useEffect } from 'react';

export default function PinInput({ length = 4, onComplete, onClear, label = 'Enter PIN', error = '' }) {
    const [digits, setDigits] = useState(Array(length).fill(''));
    const inputRefs = useRef([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();
    }, []);

    // Reset when onClear changes
    useEffect(() => {
        if (onClear) {
            setDigits(Array(length).fill(''));
            inputRefs.current[0]?.focus();
        }
    }, [onClear, length]);

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if all filled
        if (value && index === length - 1) {
            const pin = newDigits.join('');
            if (pin.length === length) {
                onComplete?.(pin);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                const newDigits = [...digits];
                newDigits[index - 1] = '';
                setDigits(newDigits);
                inputRefs.current[index - 1]?.focus();
            } else {
                const newDigits = [...digits];
                newDigits[index] = '';
                setDigits(newDigits);
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (pasted.length === length) {
            const newDigits = pasted.split('');
            setDigits(newDigits);
            inputRefs.current[length - 1]?.focus();
            onComplete?.(pasted);
        }
    };

    return (
        <div className="pin-input-container">
            {label && <p className="pin-label">{label}</p>}
            <div className="pin-inputs">
                {digits.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="password"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className={`pin-digit ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                        autoComplete="off"
                    />
                ))}
            </div>
            {error && <p className="pin-error">{error}</p>}
        </div>
    );
}
