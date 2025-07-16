import {
  type Encounter,
  type FetchResponse,
  fhirBaseUrl,
  openmrsFetch,
  restBaseUrl,
  useConfig,
  useFhirPagination,
} from '@openmrs/esm-framework';
import { useMemo, useState } from 'react';
import { type WardConfigObject } from '../config-schema';
import useWardLocation from './useWardLocation';
import useSWR from 'swr';

export interface Entry {
  resourceType: string;
  id: string;
  meta: Meta;
  status: string;
  class: {
    system: string;
    code: string;
  };
  type: Array<{
    coding: Array<Coding>;
  }>;
  subject: Subject;
  participant: Array<{
    individual: Individual;
  }>;
  period: {
    start: string;
  };
  location: Array<Location>;
  partOf: {
    reference: string;
    type: string;
  };
}

export interface Meta {
  versionId: string;
  lastUpdated: string;
  tag: Tag[];
}

export interface Tag {
  system: string;
  code: string;
  display: string;
}

export interface Coding {
  system: string;
  code: string;
  display: string;
}

export interface Subject {
  reference: string;
  type: string;
  display: string;
}

export interface Individual {
  reference: string;
  type: string;
  identifier: {
    value: string;
  };
  display: string;
}

export interface Location {
  location: { reference: string; type: string; display: string };
}

function parseDisplayText(displayText: string): { name: string; openmrsId: string } | null {
  const regex = /(.*) \(OpenMRS ID: (.*)\)/;
  const match = displayText.match(regex);

  if (match && match.length === 3) {
    const name = match[1].trim();
    const openmrsId = match[2].trim();
    return { name, openmrsId };
  } else {
    return null; // Or throw an error, depending on desired error handling
  }
}

export const useIpdDischargeEncounter = () => {
  const { isLoadingLocation, location, errorFetchingLocation } = useWardLocation();
  const { ipdDischargeEncounterTypeUuid } = useConfig<WardConfigObject>();
  const pageSizes = [10, 20, 50, 100];
  const [currPageSize, setCurrPageSize] = useState(10);
  const urls = !location
    ? null
    : `${fhirBaseUrl}/Encounter?_summary=data&type=${ipdDischargeEncounterTypeUuid}&location=${location?.uuid}`;
  const { data, isLoading, error, paginated, currentPage, goTo, totalCount, currentPageSize } =
    useFhirPagination<Entry>(urls, currPageSize);
  const encounters = useMemo(() => {
    return (data ?? []).map((entry) => {
      const { name, openmrsId } = parseDisplayText(entry.subject.display);
      const patientUuid = entry.subject.reference.split('/').at(-1);
      return {
        uuid: entry?.id,
        patient: { uuid: patientUuid, openmrsId, name },
        encounterDateTime: entry.period?.start,
      };
    });
  }, [data]);
  return {
    encounters,
    isLoading: isLoading || isLoadingLocation,
    error: error || errorFetchingLocation,
    paginated,
    currentPage,
    pageSizes,
    goTo,
    currPageSize,
    setCurrPageSize,
    totalCount,
    currentPageSize,
  };
};

export const useEncounterDetails = (encounterUuid: string) => {
  const rep =
    'custom:(uuid,display,encounterDatetime,visit:(uuid,display,encounters:(uuid,display,encounterType:(uuid,display),encounterDatetime)))';
  const url = `${restBaseUrl}/encounter/${encounterUuid}?v=${rep}`;
  const { data, error, isLoading } = useSWR<FetchResponse<Encounter>>(url, openmrsFetch);
  return {
    isLoading,
    error,
    encounter: data?.data,
  };
};
