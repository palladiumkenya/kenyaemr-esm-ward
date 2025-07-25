import { restBaseUrl, useOpenmrsFetchAll } from '@openmrs/esm-framework';
import type { DispositionType, InpatientRequest } from '../types';
import useWardLocation from './useWardLocation';

// prettier-ignore
const defaultRep =
  'custom:(' +
    'dispositionLocation,' +
    'dispositionType,' +
    'disposition,' +
    'dispositionEncounter:full,' +
    'patient:(uuid,identifiers,voided,' +
      'person:(uuid,display,gender,age,birthdate,birthtime,preferredName,preferredAddress,dead,deathDate)),' + 
    'dispositionObsGroup,' +
    'visit)';

/**
 * fetches a list of pending inpatient requests for the current ward location
 */
export function useInpatientRequest(
  dispositionType: Array<DispositionType> = ['ADMIT', 'TRANSFER'],
  rep: string = defaultRep,
  overrideLocation?:string
) {
  const { location } = useWardLocation(overrideLocation);
  const searchParams = new URLSearchParams();
  searchParams.set('dispositionType', dispositionType.join(','));
  searchParams.set('dispositionLocation', location?.uuid);
  searchParams.set('v', rep);

  const { data, ...rest } = useOpenmrsFetchAll<InpatientRequest>(
    location?.uuid ? `${restBaseUrl}/emrapi/inpatient/request?${searchParams.toString()}` : null,
  );

  return { inpatientRequests: data, ...rest };
}
