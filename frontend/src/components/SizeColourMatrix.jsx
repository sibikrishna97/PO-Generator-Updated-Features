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

// Sortable row component - now using colorId for stable keys with pricing
function SortableColorRow({ 
  colorId, 
  color, 
  sizes, 
  values, 
  onUpdate, 
  onRemove, 
  onUpdateName, 
  onUpdatePrice,
  unitPrice,
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
        {sizes.reduce((sum, s) => sum + (Number(values?.[color]?.[s]) || 0), 0)}
      </td>
    </tr>
  );
}

export const SizeColourMatrix = ({ sizes, colors, values, onChange }) => {
  // Convert colors array to objects with stable IDs if needed
  // This ensures backward compatibility while fixing the focus issue
  const [colorObjects, setColorObjects] = React.useState(() => {
    return colors.map((color, index) => ({
      id: `color-${Date.now()}-${index}`,
      name: color
    }));
  });

  // Update colorObjects when colors prop changes (e.g., on load)
  React.useEffect(() => {
    setColorObjects(prevColorObjects => {
      // If color names have changed, update them while preserving IDs
      if (colors.length !== prevColorObjects.length || 
          colors.some((color, i) => color !== prevColorObjects[i]?.name)) {
        // Check if this is a name change (same length) or structure change
        if (colors.length === prevColorObjects.length) {
          // Likely a name update, preserve IDs
          return prevColorObjects.map((obj, i) => ({
            id: obj.id,
            name: colors[i]
          }));
        } else {
          // Structure changed (add/remove), regenerate
          return colors.map((color, index) => {
            // Try to find existing ID for this color name
            const existing = prevColorObjects.find(obj => obj.name === color);
            return {
              id: existing?.id || `color-${Date.now()}-${index}-${Math.random()}`,
              name: color
            };
          });
        }
      }
      return prevColorObjects;
    });
  }, [colors]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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
    const newColorName = `Color${colors.length + 1}`;
    const newColorObj = {
      id: `color-${Date.now()}-${colorObjects.length}`,
      name: newColorName
    };
    const newColorObjects = [...colorObjects, newColorObj];
    setColorObjects(newColorObjects);
    
    const newColors = newColorObjects.map(obj => obj.name);
    const grandTotal = calculateGrandTotal(sizes, newColors, values);
    onChange({ sizes, colors: newColors, values, grandTotal });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = colorObjects.findIndex(obj => obj.id === active.id);
      const newIndex = colorObjects.findIndex(obj => obj.id === over.id);
      
      // Reorder colorObjects array
      const newColorObjects = arrayMove(colorObjects, oldIndex, newIndex);
      setColorObjects(newColorObjects);
      
      // Extract color names for parent component
      const newColors = newColorObjects.map(obj => obj.name);
      
      // Values remain the same - just the order changes
      const grandTotal = calculateGrandTotal(sizes, newColors, values);
      
      onChange({ sizes, colors: newColors, values, grandTotal });
    }
  };

  const removeColor = (index) => {
    if (colorObjects.length <= 1) return;
    const colorToRemove = colorObjects[index].name;
    const newColorObjects = colorObjects.filter((_, i) => i !== index);
    setColorObjects(newColorObjects);
    
    const newColors = newColorObjects.map(obj => obj.name);
    const newValues = { ...values };
    delete newValues[colorToRemove];
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
    const oldColorName = colorObjects[index].name;
    const newColorObjects = [...colorObjects];
    newColorObjects[index] = { ...newColorObjects[index], name: newName };
    setColorObjects(newColorObjects);
    
    const newColors = newColorObjects.map(obj => obj.name);
    
    const newValues = { ...values };
    if (newValues[oldColorName]) {
      newValues[newName] = newValues[oldColorName];
      delete newValues[oldColorName];
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
                  onUpdate={updateCell}
                  onRemove={() => removeColor(ri)}
                  onUpdateName={(newName) => updateColor(ri, newName)}
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
    </DndContext>
  );
};