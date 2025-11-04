import { type Encounter, type FetchResponse, openmrsFetch, restBaseUrl, useConfig } from '@openmrs/esm-framework';
import useSWR from 'swr';
import type { WardConfigObject } from '../config-schema';
import type { InpatientRequest as AdmissionRequest } from '../types';

export const usePatientEncounters = (patientUuid: string) => {
  const { inPatientForms } = useConfig<WardConfigObject>();
  const { data, isLoading, error, mutate } = useSWR<{
    data: { results: Array<Encounter> };
  }>(
    `${restBaseUrl}/encounter?patient=${patientUuid}&v=custom:(uuid,display,encounterDatetime,obs:full,form:(uuid,display),encounterType:(uuid,display),encounterProviders:(uuid,display,encounterRole:(uuid,display),provider:(uuid,person:(uuid,display))),orders:(uuid,display),diagnoses:(uuid,display)`,
    openmrsFetch,
  );

  const encounters =
    data?.data?.['results']?.filter((encounter) =>
      inPatientForms?.find((form) => form.uuid === encounter?.form?.uuid),
    ) ?? [];

  return {
    encounters: encounters,
    isLoading,
    error,
    mutate,
  };
};

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

export const useAdmissionRequest = (patientUuid: string) => {
  const patientUuids = [patientUuid];
  const searchParams = new URLSearchParams();
  searchParams.set('dispositionType', 'ADMIT');
  searchParams.set('patients', patientUuids.join(','));
  searchParams.set('v', defaultRep);

  const url = `${restBaseUrl}/emrapi/inpatient/request?${searchParams.toString()}`;

  const { data, isLoading, error, mutate } = useSWR<{ data: { results: Array<AdmissionRequest> } }>(url, openmrsFetch);

  return {
    admissionRequest: data?.data?.results ?? [],
    isLoading: isLoading,
    error: error,
    mutate: mutate,
  };
};

type Tag = { uuid: string; display: string; name: string; description: string };

export const useAdmissionLocationTags = (locationUuid?: string) => {
  const rep = 'custom:(tags:(uuid,display,name,description))';
  const url = `${restBaseUrl}/location/${locationUuid}?v=${rep}`;
  const { data, error, isLoading, mutate } = useSWR<FetchResponse<{ tags: Array<Tag> }>>(
    locationUuid ? url : null,
    openmrsFetch,
  );
  return {
    tags: data?.data?.tags ?? [],
    isLoading,
    error,
    mutate,
  };
};
