export const formatINR = (value) => {
  if (value == null || value === '') return '';
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(num);
};

export const formatQty = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString('en-IN');
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  } catch (e) {
    return dateStr;
  }
};