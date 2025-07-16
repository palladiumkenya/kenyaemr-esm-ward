import { restBaseUrl, useOpenmrsFetchAll } from '@openmrs/esm-framework';
import { type InpatientAdmission } from '../types';
import useWardLocation from './useWardLocation';

/**
 * fetches a list of inpatient admissions for the current ward location
 */
export function useInpatientAdmission(overrideLocation?:string) {
  const { location } = useWardLocation(overrideLocation);
  // prettier-ignore
  const customRepresentation =
    'custom:(visit:('+
    'uuid,display,patient:(uuid,display),visitType,indication,location,startDatetime,stopDatetime,'+
    'attributes,voided,encounters:(uuid,display,encounterDatetime,obs:(uuid,display,concept:(uuid,display),'+
    'obsDatetime,value),encounterType:(uuid,display))),patient:(uuid,identifiers:(uuid,display,identifier,identifierType)'+
    ',voided,person:(uuid,display,gender,age,birthdate,birthtime,preferredName,preferredAddress,dead,deathDate)),'+
    'encounterAssigningToCurrentInpatientLocation:(encounterDatetime),'+
    'currentInpatientRequest:(dispositionLocation,dispositionType,disposition:(uuid,display),'+
    'dispositionEncounter:(uuid,display),dispositionObsGroup:(uuid,display),visit:(uuid),patient:(uuid)),'+
    'firstAdmissionOrTransferEncounter:(encounterDatetime),currentInpatientLocation)'

  return useOpenmrsFetchAll<InpatientAdmission>(
    location
      ? `${restBaseUrl}/emrapi/inpatient/admission?currentInpatientLocation=${location.uuid}&v=${customRepresentation}`
      : null,
  );
}
