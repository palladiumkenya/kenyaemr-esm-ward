import {
  type Encounter,
  type FetchResponse,
  type Obs,
  openmrsFetch,
  type OpenmrsResource,
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

const labConceptRepresentation =
  'custom:(uuid,display,name,datatype,set,answers,hiNormal,hiAbsolute,hiCritical,lowNormal,lowAbsolute,lowCritical,units,allowDecimal,' +
  'setMembers:(uuid,display,answers,datatype,hiNormal,hiAbsolute,hiCritical,lowNormal,lowAbsolute,lowCritical,units,allowDecimal,set,setMembers:(uuid)))';

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
    if (diagnoses?.length)
      return diagnoses
        .map((d) => d.text)
        .join(', ')
        ?.toLowerCase();
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
  const {
    drugOrderEncounterType,
    clinicalConsultationEncounterType,
    ipdDischargeEncounterTypeUuid,
    doctorsNoteEncounterType,
    conceptUuidForWardAdmission: concepts,
  } = useConfig<WardConfigObject>();

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

  const doctorsNoteEncounters = useMemo(() => {
    const encounters = (encounter?.visit?.encounters ?? []).filter(
      (enc) => enc.encounterType.uuid === doctorsNoteEncounterType,
    );
    return encounters;
  }, [encounter, doctorsNoteEncounterType]);

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
    const obs = getComplaintsObs(doctorsNoteEncounters, concepts.complaint, concepts.chiefComplaint);
    if (obs.length) return obs.map((o) => `${(o.value as any)?.display ?? o.value}`).join(', ');
    return null;
  }, [doctorsNoteEncounters, concepts]);

  const drugReactions = useMemo(() => {
    const obs = getDrugReactions(clinicalConsultationEncounters, concepts.drugReaction, concepts.reactingDrug);
    if (obs.length)
      return obs
        .map((o) => `${(o.value as any)?.display ?? o.value}`)
        .join(', ')
        .toLowerCase();
    return null;
  }, [clinicalConsultationEncounters, concepts]);

  const ipdDischargeEncounter = useMemo<Encounter>(() => {
    const encounters = (encounter?.visit?.encounters ?? []).find(
      (enc) => enc.encounterType.uuid === ipdDischargeEncounterTypeUuid,
    );
    return encounters;
  }, [encounter, ipdDischargeEncounterTypeUuid]);

  const physicalExaminations = useMemo(() => {
    const obs = doctorsNoteEncounters.reduce<Array<Obs>>((prev, cur) => {
      if (cur.obs?.length) {
        const obs = cur.obs.filter((o) => o.concept.uuid === concepts.physicalExamination);
        prev.push(...obs);
      }
      return prev;
    }, []);
    return obs?.map((ob) => ((ob.value as any)?.display ?? ob.value)?.toLowerCase());
  }, [doctorsNoteEncounters, concepts.physicalExamination]);

  const dischargeinstructions = useMemo(() => {
    const instructionObsValue = ipdDischargeEncounter?.obs?.find(
      (o) => o.concept.uuid === concepts.dischargeInstruction,
    )?.value;
    return (instructionObsValue as any)?.display ?? instructionObsValue;
  }, [ipdDischargeEncounter, concepts.dischargeInstruction]);

  return {
    isLoading,
    error,
    drugOrders: drugorder,
    testOrders: testorder,
    orderEncounters,
    clinicalConsultationEncounters,
    complaints,
    drugReactions,
    dischargeinstructions,
    ipdDischargeEncounter,
    physicalExaminations,
  };
}

function getComplaintsObs(
  encounters: Array<Encounter>,
  complaintsConceptUuid: string,
  chiefComplainConceptUuid: string,
) {
  return encounters.reduce<Array<Obs>>((prev, curr) => {
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

function getDrugReactions(encounters: Array<Encounter>, drugReactionsConceptUuid: string, drugConceptUuid: string) {
  return encounters.reduce<Array<Obs>>((prev, curr) => {
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
type NullableNumber = number | null | undefined;
export type ObservationValue =
  | OpenmrsResource // coded
  | number // numeric
  | string // text or misc
  | null;

export interface LabOrderConcept {
  uuid: string;
  display: string;
  name?: ConceptName;
  datatype: Datatype;
  set: boolean;
  version: string;
  retired: boolean;
  descriptions: Array<Description>;
  mappings?: Array<Mapping>;
  answers?: Array<OpenmrsResource>;
  setMembers?: Array<LabOrderConcept>;
  hiNormal?: NullableNumber;
  hiAbsolute?: NullableNumber;
  hiCritical?: NullableNumber;
  lowNormal?: NullableNumber;
  lowAbsolute?: NullableNumber;
  lowCritical?: NullableNumber;
  allowDecimal?: boolean | null;
  units?: string;
}

export interface ConceptName {
  display: string;
  uuid: string;
  name: string;
  locale: string;
  localePreferred: boolean;
  conceptNameType: string;
}

export interface Datatype {
  uuid: string;
  display: string;
  name: string;
  description: string;
  hl7Abbreviation: string;
  retired: boolean;
  resourceVersion: string;
}

export interface Description {
  display: string;
  uuid: string;
  description: string;
  locale: string;
  resourceVersion: string;
}

export interface Mapping {
  display: string;
  uuid: string;
  conceptReferenceTerm: OpenmrsResource;
  conceptMapType: OpenmrsResource;
  resourceVersion: string;
}
export function useOrderConceptByUuid(uuid: string) {
  const apiUrl = `${restBaseUrl}/concept/${uuid}?v=${labConceptRepresentation}`;

  const { data, error, isLoading, isValidating, mutate } = useSWR<LabOrderConcept, Error>(uuid, fetchAllSetMembers);
  /**
   * We are fetching 2 levels of set members at one go.
   */

  const results = useMemo(
    () => ({
      concept: data,
      isLoading,
      error,
      isValidating,
      mutate,
    }),
    [data, error, isLoading, isValidating, mutate],
  );

  return results;
}

/**
 * This function fetches all the different levels of set members for a concept,
 * while fetching 2 levels of set members at one go.
 * @param conceptUuid - The UUID of the concept to fetch.
 * @returns The concept with all its set members and their set members.
 */
async function fetchAllSetMembers(conceptUuid: string): Promise<LabOrderConcept> {
  const conceptResponse = await openmrsFetch<LabOrderConcept>(getUrlForConcept(conceptUuid));
  let concept = conceptResponse.data;
  const secondLevelSetMembers = concept.set
    ? concept.setMembers
        .map((member) => (member.set ? member.setMembers.map((lowerMember) => lowerMember.uuid) : []))
        .flat()
    : [];
  if (secondLevelSetMembers.length > 0) {
    const concepts = await Promise.all(secondLevelSetMembers.map((uuid) => fetchAllSetMembers(uuid)));
    const uuidMap = concepts.reduce(
      (acc, c) => {
        acc[c.uuid] = c;
        return acc;
      },
      {} as Record<string, LabOrderConcept>,
    );
    concept.setMembers = concept.setMembers.map((member) => {
      if (member.set) {
        member.setMembers = member.setMembers.map((lowerMember) => uuidMap[lowerMember.uuid]);
      }
      return member;
    });
  }

  return concept;
}

function getUrlForConcept(conceptUuid: string) {
  return `${restBaseUrl}/concept/${conceptUuid}?v=${labConceptRepresentation}`;
}

export const getObservationDisplayValue = (value: ObservationValue): string => {
  if (!value) return '--';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (value && typeof value === 'object' && 'display' in value) return value.display;
  return '--';
};

export const getTreatmentDisplayText = (order: Order): string => {
  return `${order.drug?.display} ${order.frequency.display} for ${order.duration} ${order.durationUnits.display}`;
};
