export const useCurrency = () => {
  const formatCurrency = (val, currency = 'AED') => {
    if (val === undefined || val === null || isNaN(Number(val))) {
      return `${currency} 0.00`;
    }
    const num = Number(val);
    return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return {
    formatCurrency
  };
};
