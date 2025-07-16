import { type Location, useSession } from '@openmrs/esm-framework';
import { last } from 'lodash-es';
import useLocation from './useLocation';

const isUUID = (value?: string) => {
  const regex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
  return regex.test(value);
};

export default function useWardLocation(overrideLocation?: string): {
  location: Location;
  isLoadingLocation: boolean;
  errorFetchingLocation: Error | undefined;
  invalidLocation: boolean;
} {
  // useParams not retriving uuid since its rendered on extension slot and lacks route context
  // UseLocation also throwing and expeption
  const { pathname } = window.location;
  const segement = last(pathname.split('/'));
  let locationUuidFromUrl: string;
  if (isUUID(segement)) {
    locationUuidFromUrl = segement;
  }

  const { sessionLocation } = useSession();
  const {
    data: locationResponse,
    isLoading: isLoadingLocation,
    error: errorFetchingLocation,
  } = useLocation(overrideLocation ? overrideLocation : locationUuidFromUrl ? locationUuidFromUrl : null);
  const invalidLocation = locationUuidFromUrl && errorFetchingLocation;

  return {
    location: locationUuidFromUrl || overrideLocation ? locationResponse?.data : sessionLocation,
    isLoadingLocation,
    errorFetchingLocation,
    invalidLocation,
  };
}
