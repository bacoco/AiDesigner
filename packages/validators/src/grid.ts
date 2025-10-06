export function validateGridAlignment(
  elements: Array<{ x: number; y: number; width: number; height: number }>,
  gridSize: number = 4,
): {
  alignScore: number; // 0..1
  misalignedElements: number;
} {
  let alignedCount = 0;

  for (const el of elements) {
    const xAligned = el.x % gridSize === 0;
    const yAligned = el.y % gridSize === 0;
    const widthAligned = el.width % gridSize === 0;
    const heightAligned = el.height % gridSize === 0;

    if (xAligned && yAligned && widthAligned && heightAligned) {
      alignedCount++;
    }
  }

  return {
    alignScore: elements.length > 0 ? alignedCount / elements.length : 1,
    misalignedElements: elements.length - alignedCount,
  };
}
