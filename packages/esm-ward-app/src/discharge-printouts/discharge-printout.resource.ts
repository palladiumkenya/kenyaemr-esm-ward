import {
  type Encounter,
  type FetchResponse,
  type Obs,
  openmrsFetch,
  restBaseUrl,
  useConfig,
  type Visit,
} from '@openmrs/esm-framework';
import { type Order } from '@openmrs/esm-patient-common-lib';
import { useMemo } from 'react';
import useSWR from 'swr';
import { type WardConfigObject } from '../config-schema';
import { useEncounterDetails } from '../hooks/useIpdDischargeEncounter';
export const DATE_FORMART = 'DD/MM/YYYY';
export const TIME_FORMART = 'hh:mm A';

export const usePatientDiagnosis = (encounterUuid: string) => {
  const customRepresentation =
    'custom:(uuid,display,visit:(uuid,encounters:(uuid,diagnoses:(uuid,display,certainty,diagnosis:(coded:(uuid,display))))))';
  const url = `${restBaseUrl}/encounter/${encounterUuid}?v=${customRepresentation}`;

  const { data, error, isLoading } = useSWR<FetchResponse<{ visit: Visit }>>(url, openmrsFetch);

  const diagnoses = useMemo(() => {
    return (
      data?.data?.visit?.encounters?.flatMap(
        (encounter) =>
          encounter.diagnoses.map((diagnosis) => ({
            id: diagnosis.diagnosis.coded.uuid,
            text: diagnosis.display,
            certainty: diagnosis.certainty,
          })) || [],
      ) || []
    );
  }, [data]);
  const display = useMemo(() => {
    if (diagnoses?.length) return diagnoses.map((d) => d.text).join(', ');
    return null;
  }, [diagnoses]);

  return {
    error,
    isLoading,
    diagnoses: (diagnoses ?? []) as Array<{ id: string; text: string; certainty: string }>,
    display,
  };
};

export function usePatientOrders(dischargeEncounterUuId: string) {
  const rep =
    'custom:(uuid,display,location:(display),encounterDatetime,visit:(uuid,display,encounters:(uuid,display,encounterType:(uuid,display),encounterDatetime,orders,obs)))';
  const { encounter, error, isLoading } = useEncounterDetails(dischargeEncounterUuId, rep);
  const { drugOrderEncounterType, clinicalConsultationEncounterType } = useConfig<WardConfigObject>();
  const orderEncounters = useMemo(() => {
    const encounters = (encounter?.visit?.encounters ?? []).filter(
      (enc) => enc.encounterType.uuid === drugOrderEncounterType,
    );
    return encounters;
  }, [encounter, drugOrderEncounterType]);
  const clinicalConsultationEncounters = useMemo(() => {
    const encounters = (encounter?.visit?.encounters ?? []).filter(
      (enc) => enc.encounterType.uuid === clinicalConsultationEncounterType,
    );
    return encounters;
  }, [encounter, clinicalConsultationEncounterType]);
  const { drugorder, testorder } = useMemo<{ drugorder: Array<Order>; testorder: Array<Order> }>(
    () =>
      orderEncounters.reduce(
        (prev, curr) => {
          if (curr.orders?.length) {
            prev['drugorder'].push(...curr.orders.filter((order) => order.type === 'drugorder'));
            prev['testorder'].push(...curr.orders.filter((order) => order.type === 'testorder'));
          }
          return prev;
        },
        { drugorder: [], testorder: [] },
      ),
    [orderEncounters],
  );
  const complaints = useMemo(() => {
    const obs = getComplaintsObs(clinicalConsultationEncounters);
    if (obs.length) return obs.map((o) => `${(o.value as any)?.display ?? o.value}`).join(', ');
    return null;
  }, [clinicalConsultationEncounters]);
  const drugReactions = useMemo(() => {
    const obs = getDrugReactions(clinicalConsultationEncounters);
    if (obs.length)
      return obs
        .map((o) => `${(o.value as any)?.display ?? o.value}`)
        .join(', ')
        .toLowerCase();
    return null;
  }, [clinicalConsultationEncounters]);
  return {
    isLoading,
    error,
    drugOrders: drugorder,
    testOrders: testorder,
    orderEncounters,
    clinicalConsultationEncounters,
    complaints,
    drugReactions,
  };
}

function getComplaintsObs(clinialConsultationEncounters: Array<Encounter>) {
  // TODO Add concepts to config
  const complaintsConceptUuid = '160531AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const chiefComplainConceptUuid = '5219AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

  return clinialConsultationEncounters.reduce<Array<Obs>>((prev, curr) => {
    if (curr.obs.length) {
      const complaintObs = curr.obs
        .filter((o) => o.concept.uuid === complaintsConceptUuid && o.groupMembers)
        .flatMap((o) => o.groupMembers)
        .filter((o) => o.concept.uuid === chiefComplainConceptUuid);
      prev.push(...complaintObs);
    }
    return prev;
  }, []);
}

function getDrugReactions(clinialConsultationEncounters: Array<Encounter>) {
  // TODO: aDD CONCEPTS TO CONFIG
  const drugReactionsConceptUuid = '162747AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const drugConceptUuid = '1193AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  return clinialConsultationEncounters.reduce<Array<Obs>>((prev, curr) => {
    if (curr.obs.length) {
      const complaintObs = curr.obs
        .filter((o) => o.concept.uuid === drugReactionsConceptUuid && o.groupMembers)
        .flatMap((o) => o.groupMembers)
        .filter((o) => o.concept.uuid === drugConceptUuid);
      prev.push(...complaintObs);
    }
    return prev;
  }, []);
}
