import { IBiometricAdapter } from './IBiometricAdapter';
import { MockBiometricAdapter } from './MockBiometricAdapter';
import { ZKTecoAdapter } from './ZKTecoAdapter';
import { BioStarAdapter } from './BioStarAdapter';
import { HikvisionAdapter } from './HikvisionAdapter';
import { GenericBiometricAdapter } from './GenericBiometricAdapter';
import { BiometricDeviceConfig } from '../../types';

export function getBiometricAdapter(type: string): IBiometricAdapter {
  switch (type) {
    case 'zkteco':
      return new ZKTecoAdapter();
    case 'biostar':
      return new BioStarAdapter();
    case 'hikvision':
      return new HikvisionAdapter();
    case 'generic':
      return new GenericBiometricAdapter();
    case 'mock':
    default:
      return new MockBiometricAdapter();
  }
}

export { BiometricDeviceTypeNames } from './IBiometricAdapter';
