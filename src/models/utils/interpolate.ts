export const interpolate = (array: number[], index: number): number => {
  // If the index is an integer, no interpolation is needed.
  if (Number.isInteger(index)) {
    return array[index];
  }

  // Calculate the indices of the levels to interpolate between
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  // Linear interpolation formula: y = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
  // Where x is the index, and y0, y1 are the values at the lower and upper indices
  const interpolatedVal = array[lowerIndex] + (array[upperIndex] - array[lowerIndex]) * (index - lowerIndex);

  return interpolatedVal;
};
