import {
  type FetchResponse,
  openmrsFetch,
  restBaseUrl,
  useFeatureFlag,
  useOpenmrsPagination,
} from '@openmrs/esm-framework';
import useSWR from 'swr';
import { type AdmissionLocationFetchResponse } from '../types/index';
import useWardLocation from './useWardLocation';
import { useState } from 'react';

const requestRep =
  'custom:(ward,totalBeds,occupiedBeds,bedLayouts:(rowNumber,bedType,columnNumber,bedNumber,bedId,bedUuid,status,location,patients:(person:full,identifiers,uuid)))';

/**
 *
 * Fetches bed information (including info about patients in those beds) for a location,
 * as provided by the bed management module. If the bed management module is not installed,
 * then no request will be made, the return object's
 * `isLoading` field will be false, and the `admissionLocation` field will be undefined.
 *
 * Note that "admissionLocation" isn't the clearest name, but it matches the endpoint name
 *
 * @param rep the "v=" representation parameter
 * @returns
 */
export function useAdmissionLocation(rep: string = requestRep, overrideLocation: string | null = null) {
  const { location } = useWardLocation(overrideLocation);
  const isBedManagementModuleInstalled = useFeatureFlag('bedmanagement-module');

  const apiUrl = location?.uuid ? `${restBaseUrl}/admissionLocation/${location?.uuid}?v=${rep}` : null;
  const { data, ...rest } = useSWR<FetchResponse<AdmissionLocationFetchResponse>, Error>(
    isBedManagementModuleInstalled ? apiUrl : null,
    openmrsFetch,
  );

  return {
    admissionLocation: data?.data,
    ...rest,
  };
}

export const useAdmisiionLocations = () => {
  const apiUrl = `${restBaseUrl}/admissionLocation`;
  const pageSizes = [10, 20, 50, 100];
  const [currPageSize, setCurrPageSize] = useState(10);
  const { data, ...rest } = useOpenmrsPagination<AdmissionLocationFetchResponse>(apiUrl, currPageSize);
  return {
    ...rest,
    admissionLocations: data ?? [],
    pageSizes,
    currPageSize,
    setCurrPageSize,
  };
};
