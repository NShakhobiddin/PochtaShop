import type { VolumetricWeightInput, VolumetricWeightResult } from '@/types';

export const DEFAULT_VOLUMETRIC_DIVISOR = 6000;

/**
 * Volumetric (dimensional) weight = L × W × H ÷ divisor, with the divisor set
 * by the courier. Carriers bill on whichever of actual/volumetric is larger.
 */
export function calculateVolumetricWeight(input: VolumetricWeightInput): VolumetricWeightResult {
  const divisor = input.divisor > 0 ? input.divisor : DEFAULT_VOLUMETRIC_DIVISOR;
  const volumetricWeightKg =
    (input.lengthCm * input.widthCm * input.heightCm) / divisor;

  const actualWeightKg = input.actualWeightKg;
  const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeightKg);

  return {
    actualWeightKg: round2(actualWeightKg),
    volumetricWeightKg: round2(volumetricWeightKg),
    chargeableWeightKg: round2(chargeableWeightKg),
    usedVolumetric: volumetricWeightKg > actualWeightKg,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
