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

// Sortable row component
function SortableColorRow({ color, sizes, values, onUpdate, onRemove, onUpdateName, canRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: color });

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
    const newColor = `Color${colors.length + 1}`;
    const newColors = [...colors, newColor];
    const grandTotal = calculateGrandTotal(sizes, newColors, values);
    onChange({ sizes, colors: newColors, values, grandTotal });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = colors.indexOf(active.id);
      const newIndex = colors.indexOf(over.id);
      
      // Reorder colors array
      const newColors = arrayMove(colors, oldIndex, newIndex);
      
      // Values remain the same - just the order changes
      const grandTotal = calculateGrandTotal(sizes, newColors, values);
      
      onChange({ sizes, colors: newColors, values, grandTotal });
    }
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
              items={colors}
              strategy={verticalListSortingStrategy}
            >
              {colors.map((color, ri) => (
                <SortableColorRow
                  key={color}
                  color={color}
                  sizes={sizes}
                  values={values}
                  onUpdate={updateCell}
                  onRemove={() => removeColor(ri)}
                  onUpdateName={(newName) => updateColor(ri, newName)}
                  canRemove={colors.length > 1}
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