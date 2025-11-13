import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Plus, X, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatINR } from '../utils/formatters';

// Sortable row component - now using colorId for stable keys with pricing and HSN
function SortableColorRow({ 
  colorId, 
  color, 
  sizes, 
  values, 
  onUpdate, 
  onRemove, 
  onUpdateName, 
  onUpdatePrice,
  onUpdateHSN,
  unitPrice,
  hsnCode,
  canRemove 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: colorId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate row quantity and amount
  const rowQty = sizes.reduce((sum, s) => sum + (Number(values?.[color]?.[s]) || 0), 0);
  const rowAmount = rowQty * (unitPrice || 0);
  const hasWarning = unitPrice === 0 || unitPrice === '' || unitPrice === null;

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="border border-neutral-300 px-2 py-1 bg-neutral-50 font-medium">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-neutral-400" />
          </button>
          <Input
            value={color}
            onChange={(e) => onUpdateName(e.target.value)}
            className="h-7 text-sm"
            placeholder="Color"
          />
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </td>
      <td className="border border-neutral-300 px-2 py-1">
        <Input
          type="text"
          value={hsnCode || ''}
          onChange={(e) => onUpdateHSN(e.target.value)}
          className="h-7 text-sm"
          placeholder="HSN Code"
        />
      </td>
      {sizes.map(size => (
        <td key={size} className="border border-neutral-300 px-2 py-1">
          <Input
            type="number"
            value={values?.[color]?.[size] || ''}
            onChange={(e) => onUpdate(color, size, e.target.value)}
            className="h-7 text-sm text-center"
            placeholder="0"
            data-testid={`matrix-cell-${color}-${size}`}
          />
        </td>
      ))}
      <td className="border border-neutral-300 px-2 py-1 bg-neutral-100 font-medium text-center">
        {rowQty}
      </td>
      <td className={`border border-neutral-300 px-2 py-1 ${hasWarning ? 'border-amber-400 border-2' : ''}`}>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={unitPrice || ''}
          onChange={(e) => {
            const value = e.target.value;
            // Allow only numbers and up to 2 decimal places
            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
              onUpdatePrice(parseFloat(value) || 0);
            }
          }}
          className="h-7 text-sm text-right"
          placeholder="0.00"
        />
      </td>
      <td className="border border-neutral-300 px-2 py-1 bg-neutral-50 font-medium text-right">
        {formatINR(rowAmount)}
      </td>
    </tr>
  );
}

export const SizeColourMatrix = ({ sizes, colors, values, onChange, defaultUnitPrice = 0 }) => {
  // Convert colors to objects with stable IDs and pricing
  // Colors can be: ["Black", "Grey"] (old) or [{name: "Black", unitPrice: 295}, ...] (new)
  const [colorObjects, setColorObjects] = React.useState(() => {
    return colors.map((color, index) => {
      if (typeof color === 'string') {
        // Old format - convert to new
        return {
          id: `color-${Date.now()}-${index}`,
          name: color,
          unitPrice: defaultUnitPrice
        };
      } else {
        // New format - add ID if missing
        return {
          id: color.id || `color-${Date.now()}-${index}`,
          name: color.name,
          unitPrice: color.unitPrice || color.unit_price || defaultUnitPrice
        };
      }
    });
  });

  // Update colorObjects when colors prop changes (e.g., on load)
  React.useEffect(() => {
    setColorObjects(prevColorObjects => {
      // Convert incoming colors to comparable format
      const incomingColors = colors.map(c => 
        typeof c === 'string' ? { name: c, unitPrice: defaultUnitPrice } : 
        { name: c.name, unitPrice: c.unitPrice || c.unit_price || defaultUnitPrice }
      );
      
      // Check if data has changed
      const hasChanged = colors.length !== prevColorObjects.length || 
        incomingColors.some((color, i) => 
          color.name !== prevColorObjects[i]?.name || 
          color.unitPrice !== prevColorObjects[i]?.unitPrice
        );
      
      if (hasChanged) {
        // Update while preserving IDs where possible
        return incomingColors.map((color, index) => {
          const existing = prevColorObjects.find(obj => obj.name === color.name);
          return {
            id: existing?.id || `color-${Date.now()}-${index}-${Math.random()}`,
            name: color.name,
            unitPrice: color.unitPrice
          };
        });
      }
      return prevColorObjects;
    });
  }, [colors, defaultUnitPrice]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Helper to get color names from color objects
  const getColorNames = (colorObjs) => colorObjs.map(c => c.name);
  
  // Helper function to calculate grand total quantity
  const calculateGrandTotal = (sizesList, colorObjs, valuesList) => {
    const colorNames = getColorNames(colorObjs);
    return colorNames.reduce((acc, c) => {
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
    
    const grandTotal = calculateGrandTotal(sizes, colorObjects, newValues);
    const colorData = colorObjects.map(obj => ({ name: obj.name, unitPrice: obj.unitPrice }));
    
    onChange({ sizes, colors: colorData, values: newValues, grandTotal });
  };

  const addSize = () => {
    const newSize = `Size${sizes.length + 1}`;
    const newSizes = [...sizes, newSize];
    const grandTotal = calculateGrandTotal(newSizes, colorObjects, values);
    const colorData = colorObjects.map(obj => ({ name: obj.name, unitPrice: obj.unitPrice }));
    onChange({ sizes: newSizes, colors: colorData, values, grandTotal });
  };

  const removeSize = (index) => {
    if (sizes.length <= 1) return;
    const newSizes = sizes.filter((_, i) => i !== index);
    const newValues = { ...values };
    colorObjects.forEach(colorObj => {
      const colorName = colorObj.name;
      if (newValues[colorName]) {
        delete newValues[colorName][sizes[index]];
      }
    });
    const grandTotal = calculateGrandTotal(newSizes, colorObjects, newValues);
    const colorData = colorObjects.map(obj => ({ name: obj.name, unitPrice: obj.unitPrice }));
    onChange({ sizes: newSizes, colors: colorData, values: newValues, grandTotal });
  };

  const addColor = () => {
    const newColorName = `Color${colorObjects.length + 1}`;
    const newColorObj = {
      id: `color-${Date.now()}-${colorObjects.length}`,
      name: newColorName,
      unitPrice: defaultUnitPrice
    };
    const newColorObjects = [...colorObjects, newColorObj];
    setColorObjects(newColorObjects);
    
    const grandTotal = calculateGrandTotal(sizes, newColorObjects, values);
    const colorData = newColorObjects.map(obj => ({ name: obj.name, unitPrice: obj.unitPrice }));
    onChange({ sizes, colors: colorData, values, grandTotal });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = colorObjects.findIndex(obj => obj.id === active.id);
      const newIndex = colorObjects.findIndex(obj => obj.id === over.id);
      
      // Reorder colorObjects array (including prices)
      const newColorObjects = arrayMove(colorObjects, oldIndex, newIndex);
      setColorObjects(newColorObjects);
      
      // Values remain the same - just the order changes
      const grandTotal = calculateGrandTotal(sizes, newColorObjects, values);
      const colorData = newColorObjects.map(obj => ({ name: obj.name, unitPrice: obj.unitPrice }));
      
      onChange({ sizes, colors: colorData, values, grandTotal });
    }
  };

  const removeColor = (index) => {
    if (colorObjects.length <= 1) return;
    const colorToRemove = colorObjects[index].name;
    const newColorObjects = colorObjects.filter((_, i) => i !== index);
    setColorObjects(newColorObjects);
    
    const newValues = { ...values };
    delete newValues[colorToRemove];
    const grandTotal = calculateGrandTotal(sizes, newColorObjects, newValues);
    const colorData = newColorObjects.map(obj => ({ name: obj.name, unitPrice: obj.unitPrice }));
    onChange({ sizes, colors: colorData, values: newValues, grandTotal });
  };

  const updateSize = (index, newName) => {
    const oldSize = sizes[index];
    const newSizes = [...sizes];
    newSizes[index] = newName;
    
    const newValues = { ...values };
    colorObjects.forEach(colorObj => {
      const colorName = colorObj.name;
      if (newValues[colorName]?.[oldSize] !== undefined) {
        newValues[colorName][newName] = newValues[colorName][oldSize];
        delete newValues[colorName][oldSize];
      }
    });
    
    const grandTotal = calculateGrandTotal(newSizes, colorObjects, newValues);
    const colorData = colorObjects.map(obj => ({ name: obj.name, unitPrice: obj.unitPrice }));
    onChange({ sizes: newSizes, colors: colorData, values: newValues, grandTotal });
  };

  const updateColor = (index, newName) => {
    const oldColorName = colorObjects[index].name;
    const newColorObjects = [...colorObjects];
    newColorObjects[index] = { ...newColorObjects[index], name: newName };
    setColorObjects(newColorObjects);
    
    const newValues = { ...values };
    if (newValues[oldColorName]) {
      newValues[newName] = newValues[oldColorName];
      delete newValues[oldColorName];
    }
    
    const grandTotal = calculateGrandTotal(sizes, newColorObjects, newValues);
    const colorData = newColorObjects.map(obj => ({ name: obj.name, unitPrice: obj.unitPrice }));
    onChange({ sizes, colors: colorData, values: newValues, grandTotal });
  };

  const updatePrice = (index, newPrice) => {
    const newColorObjects = [...colorObjects];
    newColorObjects[index] = { ...newColorObjects[index], unitPrice: newPrice };
    setColorObjects(newColorObjects);
    
    const grandTotal = calculateGrandTotal(sizes, newColorObjects, values);
    const colorData = newColorObjects.map(obj => ({ name: obj.name, unitPrice: obj.unitPrice }));
    onChange({ sizes, colors: colorData, values, grandTotal });
  };

  const getRowTotal = (color) => {
    return sizes.reduce((sum, size) => {
      return sum + (Number(values?.[color]?.[size]) || 0);
    }, 0);
  };

  const getColTotal = (size) => {
    return colorObjects.reduce((sum, colorObj) => {
      return sum + (Number(values?.[colorObj.name]?.[size]) || 0);
    }, 0);
  };

  // Calculate totals
  const grandTotalQty = colorObjects.reduce((acc, colorObj) => {
    return acc + getRowTotal(colorObj.name);
  }, 0);
  
  const grandTotalAmount = colorObjects.reduce((acc, colorObj) => {
    const rowQty = getRowTotal(colorObj.name);
    const rowAmount = rowQty * (colorObj.unitPrice || 0);
    return acc + rowAmount;
  }, 0);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="border rounded-md overflow-hidden" data-testid="matrix-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="matrix-table">
            <thead className="bg-neutral-100">
              <tr>
                <th className="text-left p-2 min-w-[180px] border-r border-neutral-200">
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
              <th className="text-center p-2 min-w-[80px] border-r border-neutral-200">
                <span className="font-semibold">Quantity</span>
              </th>
              <th className="text-center p-2 min-w-[100px] border-r border-neutral-200">
                <span className="font-semibold">Unit Price</span>
              </th>
              <th className="text-center p-2 min-w-[80px] border-l-2 border-neutral-300">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={addSize}
                    className="h-6 w-6 p-0"
                    data-testid="matrix-add-size"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="font-semibold">Amount</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={colorObjects.map(obj => obj.id)}
              strategy={verticalListSortingStrategy}
            >
              {colorObjects.map((colorObj, ri) => (
                <SortableColorRow
                  key={colorObj.id}
                  colorId={colorObj.id}
                  color={colorObj.name}
                  sizes={sizes}
                  values={values}
                  unitPrice={colorObj.unitPrice}
                  onUpdate={updateCell}
                  onRemove={() => removeColor(ri)}
                  onUpdateName={(newName) => updateColor(ri, newName)}
                  onUpdatePrice={(newPrice) => updatePrice(ri, newPrice)}
                  canRemove={colorObjects.length > 1}
                />
              ))}
            </SortableContext>
          </tbody>
          <tfoot className="border-t-2 border-neutral-300">
            <tr className="bg-neutral-50 font-semibold">
              <td className="p-2 border-r border-neutral-200">Total</td>
              {sizes.map((size, ci) => {
                const colTotal = getColTotal(size);
                return (
                  <td key={ci} className="p-2 text-center border-r border-neutral-200" data-testid={`matrix-col-total-${size}`}>
                    {colTotal}
                  </td>
                );
              })}
              <td className="p-2 text-center border-r border-neutral-200" data-testid="matrix-grand-total-qty">
                {grandTotalQty}
              </td>
              <td className="p-2 text-center border-r border-neutral-200" colSpan="1">
                {/* Empty cell for Unit Price column */}
              </td>
              <td className="p-2 text-right border-l-2 border-neutral-300" data-testid="matrix-grand-total-amount">
                {formatINR(grandTotalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {/* Totals Summary Bar */}
      <div className="mt-4 flex justify-end gap-8 text-sm font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-neutral-600">Total Quantity:</span>
          <span className="text-lg">{grandTotalQty} pieces</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-600">Total Amount:</span>
          <span className="text-lg text-blue-600">{formatINR(grandTotalAmount)}</span>
        </div>
      </div>
    </div>
    </DndContext>
  );
};