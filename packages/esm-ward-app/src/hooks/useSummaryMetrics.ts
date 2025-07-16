import { OpenmrsResource, restBaseUrl, useConfig, useOpenmrsFetchAll } from '@openmrs/esm-framework';
import { useMemo } from 'react';
import { WardConfigObject } from '../config-schema';
import { AdmissionLocationFetchResponse } from '../types';
import { useIpdDischargeEncounter } from './useIpdDischargeEncounter';
import { useWardPatientGrouping } from './useWardPatientGrouping';

export const useWardsSummaryMetrics = () => {
  const rep = 'custom:(totalBeds,occupiedBeds,bedLayouts:(patients:(uuid,display)))';

  const apiUrl = `${restBaseUrl}/admissionLocation?v=${rep}`;
  const { data = [], isLoading, error } = useOpenmrsFetchAll<AdmissionLocationFetchResponse>(apiUrl);
  const totalBeds = useMemo(() => {
    return data.reduce((prev, curr) => {
      return prev + curr.totalBeds;
    }, 0);
  }, [data]);
  const occupiedBeds = useMemo(() => {
    return data.reduce((prev, curr) => {
      return prev + curr.occupiedBeds;
    }, 0);
  }, [data]);
  const bedOccupancy = useMemo(() => {
    if (!totalBeds || !occupiedBeds) return `0%`;
    return `${((occupiedBeds / totalBeds) * 100).toFixed(2)}%`;
  }, [totalBeds, occupiedBeds]);

  const admittedPatients = useMemo(() => {
    return data.reduce((prev, curr) => {
      return (
        prev +
        curr.bedLayouts?.reduce((p, c) => {
          return p + (c.patients?.length ?? 0);
        }, 0)
      );
    }, 0);
  }, [totalBeds, occupiedBeds]);
  return {
    totalBeds,
    occupiedBeds,
    freeBeds: totalBeds - occupiedBeds,
    bedOccupancy,
    admittedPatients,
    isLoading,
    error,
  };
};

export const useWardSummaryMetrics = () => {
  const wardPatientGroupDetails = useWardPatientGrouping();

  const { totalCount: dischargedPatients } = useIpdDischargeEncounter();
  const config = useConfig<WardConfigObject>();
  const { admittedPatients, dischargeInPatients } = useMemo(() => {
    let admittedPatients = 0;
    let dischargeInPatients = 0;
    wardPatientGroupDetails.bedLayouts?.forEach((bedLayout) => {
      const { patients } = bedLayout;
      for (const patient of patients) {
        const inpatientAdmission = wardPatientGroupDetails.wardAdmittedPatientsWithBed?.get(patient.uuid);
        if (inpatientAdmission) {
          const { visit } = inpatientAdmission;
          const noteEncounter = visit?.encounters?.find(
            (encounter) => encounter.encounterType?.uuid === config.doctorsnoteEncounterTypeUuid,
          );
          if (!noteEncounter) {
            admittedPatients++;
            continue;
          }
          const obs = noteEncounter.obs.find((ob) => ob.concept.uuid === config.referralsConceptUuid);
          if (!obs) {
            admittedPatients++;
            continue;
          }
          const isDischargedIn = [
            config.referringToAnotherFacilityConceptUuid,
            config.dischargeHomeConceptUuid,
          ].includes((obs.value as OpenmrsResource).uuid);
          if (isDischargedIn) {
            dischargeInPatients++;
            continue;
          } else {
            admittedPatients++;
            continue;
          }
        } else {
          admittedPatients++;
        }
      }
    });
    return { admittedPatients, dischargeInPatients };
  }, [wardPatientGroupDetails, config]);
  const awaitingAdmissionPatient = useMemo(
    () => wardPatientGroupDetails.inpatientRequestResponse?.inpatientRequests?.length ?? 0,
    [wardPatientGroupDetails],
  );
  return {
    dischargedPatients,
    admittedPatients,
    dischargeInPatients,
    awaitingAdmissionPatient,
  };
};