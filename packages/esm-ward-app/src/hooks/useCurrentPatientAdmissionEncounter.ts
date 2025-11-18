import { useEmrConfiguration, useVisit } from '@openmrs/esm-framework';
import { useMemo } from 'react';

/**
 * fetches the latest admission encounter for the current patient, could be an admission encounter or a transfer encounter
 * Since the patient can be transferred to multiple locations, we need to fetch the latest admission encounter for the current patient
 * The visit encounters are sorted by encounter datetime in descending order, so the latest admission encounter is the first one
 * @param patientUuid
 * @returns {
 *   admissionEncounter: the latest admission encounter
 *   isLoading: whether the admission encounter is loading
 *   error: the error fetching the admission encounter
 *   mutate: mutate the admission encounter
 *   currentVisit: the current visit
 *   dischargeEncounter: the discharge encounter
 *   isPatientAdmitted: whether the patient is admitted
 * }
 */
const useCurrentPatientAdmissionEncounter = (patientUuid: string) => {
  const { currentVisit, error: visitError, isLoading: isLoadingVisit, mutate: mutateVisit } = useVisit(patientUuid);
  const { emrConfiguration, isLoadingEmrConfiguration, errorFetchingEmrConfiguration } = useEmrConfiguration();

  const admissionEncounters = useMemo(() => {
    return currentVisit?.encounters?.filter(
      (encounter) =>
        encounter.encounterType.uuid === emrConfiguration?.admissionEncounterType?.uuid ||
        encounter.encounterType.uuid === emrConfiguration?.transferWithinHospitalEncounterType?.uuid,
    );
  }, [currentVisit, emrConfiguration]);

  const dischargeEncounter = useMemo(() => {
    return currentVisit?.encounters?.find(
      (encounter) => encounter.encounterType.uuid === emrConfiguration?.exitFromInpatientEncounterType?.uuid,
    );
  }, [currentVisit, emrConfiguration]);

  const isPatientAdmitted = useMemo(() => {
    return admissionEncounters?.[0] && !dischargeEncounter;
  }, [admissionEncounters, dischargeEncounter]);

  return {
    admissionEncounter: admissionEncounters?.[0],
    isLoading: isLoadingVisit || isLoadingEmrConfiguration,
    error: visitError || errorFetchingEmrConfiguration,
    mutate: mutateVisit,
    currentVisit,
    dischargeEncounter,
    isPatientAdmitted,
  };
};

export default useCurrentPatientAdmissionEncounter;
