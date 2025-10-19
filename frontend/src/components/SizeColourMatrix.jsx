import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Plus, X } from 'lucide-react';

export const SizeColourMatrix = ({ sizes, colors, values, onChange }) => {
  // Helper function to calculate grand total
  const calculateGrandTotal = (sizesList, colorsList, valuesList) => {
    return colorsList.reduce((acc, c) => {
      return acc + sizesList.reduce((sum, s) => {
        return sum + (Number(valuesList?.[c]?.[s]) || 0);
      }, 0);
    }, 0);
  };

  const updateCell = (color, size, value) => {
    const newValues = {
      ...values,
      [color]: {
        ...(values?.[color] || {}),
        [size]: value === '' ? 0 : parseInt(value) || 0
      }
    };
    
    const grandTotal = calculateGrandTotal(sizes, colors, newValues);
    
    onChange({ sizes, colors, values: newValues, grandTotal });
  };

  const addSize = () => {
    const newSize = `Size${sizes.length + 1}`;
    const newSizes = [...sizes, newSize];
    const grandTotal = calculateGrandTotal(newSizes, colors, values);
    onChange({ sizes: newSizes, colors, values, grandTotal });
  };

  const removeSize = (index) => {
    if (sizes.length <= 1) return;
    const newSizes = sizes.filter((_, i) => i !== index);
    const newValues = { ...values };
    colors.forEach(color => {
      if (newValues[color]) {
        delete newValues[color][sizes[index]];
      }
    });
    const grandTotal = calculateGrandTotal(newSizes, colors, newValues);
    onChange({ sizes: newSizes, colors, values: newValues, grandTotal });
  };

  const addColor = () => {
    const newColor = `Color${colors.length + 1}`;
    const newColors = [...colors, newColor];
    const grandTotal = calculateGrandTotal(sizes, newColors, values);
    onChange({ sizes, colors: newColors, values, grandTotal });
  };

  const removeColor = (index) => {
    if (colors.length <= 1) return;
    const newColors = colors.filter((_, i) => i !== index);
    const newValues = { ...values };
    delete newValues[colors[index]];
    const grandTotal = calculateGrandTotal(sizes, newColors, newValues);
    onChange({ sizes, colors: newColors, values: newValues, grandTotal });
  };

  const updateSize = (index, newName) => {
    const oldSize = sizes[index];
    const newSizes = [...sizes];
    newSizes[index] = newName;
    
    const newValues = { ...values };
    colors.forEach(color => {
      if (newValues[color]?.[oldSize] !== undefined) {
        newValues[color][newName] = newValues[color][oldSize];
        delete newValues[color][oldSize];
      }
    });
    
    const grandTotal = calculateGrandTotal(newSizes, colors, newValues);
    onChange({ sizes: newSizes, colors, values: newValues, grandTotal });
  };

  const updateColor = (index, newName) => {
    const oldColor = colors[index];
    const newColors = [...colors];
    newColors[index] = newName;
    
    const newValues = { ...values };
    if (newValues[oldColor]) {
      newValues[newName] = newValues[oldColor];
      delete newValues[oldColor];
    }
    
    const grandTotal = calculateGrandTotal(sizes, newColors, newValues);
    onChange({ sizes, colors: newColors, values: newValues, grandTotal });
  };

  const getRowTotal = (color) => {
    return sizes.reduce((sum, size) => {
      return sum + (Number(values?.[color]?.[size]) || 0);
    }, 0);
  };

  const getColTotal = (size) => {
    return colors.reduce((sum, color) => {
      return sum + (Number(values?.[color]?.[size]) || 0);
    }, 0);
  };

  const grandTotal = colors.reduce((acc, color) => {
    return acc + getRowTotal(color);
  }, 0);

  return (
    <div className="border rounded-md overflow-hidden" data-testid="matrix-container">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="matrix-table">
          <thead className="bg-neutral-100">
            <tr>
              <th className="text-left p-2 min-w-[140px] border-r border-neutral-200">
                <div className="flex items-center justify-between">
                  <span>Colour</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={addColor}
                    className="h-6 w-6 p-0"
                    data-testid="matrix-add-color"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </th>
              {sizes.map((size, i) => (
                <th key={i} className="text-center p-2 min-w-[90px] border-r border-neutral-200" data-testid={`matrix-size-header-${size}`}>
                  <div className="flex items-center justify-center gap-1">
                    <Input
                      type="text"
                      value={size}
                      onChange={(e) => updateSize(i, e.target.value)}
                      className="h-7 text-center font-semibold border-0 bg-transparent p-1"
                      data-testid={`matrix-size-input-${i}`}
                    />
                    {sizes.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSize(i)}
                        className="h-5 w-5 p-0"
                        data-testid={`matrix-remove-size-${i}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
              <th className="text-center p-2 min-w-[80px] border-l-2 border-neutral-300">
                <div className="flex items-center justify-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={addSize}
                    className="h-6 w-6 p-0 mr-2"
                    data-testid="matrix-add-size"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="font-semibold">Total</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {colors.map((color, ri) => {
              const rowTotal = getRowTotal(color);
              return (
                <tr key={ri} className="border-t border-neutral-200" data-testid={`matrix-color-row-${color}`}>
                  <td className="p-2 border-r border-neutral-200">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={color}
                        onChange={(e) => updateColor(ri, e.target.value)}
                        className="h-8 border-0 bg-transparent font-medium"
                        data-testid={`matrix-color-input-${ri}`}
                      />
                      {colors.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeColor(ri)}
                          className="h-6 w-6 p-0"
                          data-testid={`matrix-remove-color-${ri}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                  {sizes.map((size, ci) => (
                    <td key={ci} className="p-1 border-r border-neutral-200">
                      <Input
                        type="number"
                        min="0"
                        value={values?.[color]?.[size] || ''}
                        onChange={(e) => updateCell(color, size, e.target.value)}
                        className="h-8 text-right"
                        data-testid={`matrix-cell-${color}-${size}`}
                      />
                    </td>
                  ))}
                  <td className="p-2 text-right font-medium border-l-2 border-neutral-300" data-testid={`matrix-row-total-${color}`}>
                    {rowTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-neutral-300">
            <tr className="bg-neutral-50 font-semibold">
              <td className="p-2 border-r border-neutral-200">Total</td>
              {sizes.map((size, ci) => {
                const colTotal = getColTotal(size);
                return (
                  <td key={ci} className="p-2 text-right border-r border-neutral-200" data-testid={`matrix-col-total-${size}`}>
                    {colTotal}
                  </td>
                );
              })}
              <td className="p-2 text-right border-l-2 border-neutral-300" data-testid="matrix-grand-total">
                {grandTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};