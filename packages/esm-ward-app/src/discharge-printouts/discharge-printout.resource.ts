import {
  type FetchResponse,
  fhirBaseUrl,
  openmrsFetch,
  restBaseUrl,
  useConfig,
  type Visit,
} from '@openmrs/esm-framework';
import { useMemo } from 'react';
import useSWR from 'swr';
import { useEncounterDetails } from '../hooks/useIpdDischargeEncounter';
import { type WardConfigObject } from '../config-schema';
import { type Order } from '@openmrs/esm-patient-common-lib';
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

export interface AllergyIntoleranceResponse {
  resourceType: string;
  id: string;
  meta: {
    lastUpdated: string;
  };
  type: string;
  total: number;
  entry: Array<{
    resource: AllergyIntolerance;
  }>;
}

export interface AllergyIntolerance {
  resourceType: string;
  id: string;
  meta: {
    lastUpdated: string;
  };
  clinicalStatus: {
    coding: [
      {
        system: string;
        code: string;
        display: string;
      },
    ];
    text: string;
  };
  verificationStatus: {
    coding: [
      {
        system: string;
        code: string;
        display: string;
      },
    ];
    text: string;
  };
  type: string;
  category: Array<string>;
  criticality: string;
  code: {
    coding: [
      {
        code: string;
        display: string;
      },
    ];
    text: string;
  };
  patient: {
    reference: string;
    type: string;
    display: string;
  };
  recordedDate: string;
  recorder: {
    reference: string;
    type: string;
    display: string;
  };
  reaction: [
    {
      substance: {
        coding: [
          {
            code: string;
            display: string;
          },
        ];
        text: string;
      };
      manifestation: [
        {
          coding: [
            {
              code: string;
              display: string;
            },
          ];
          text: string;
        },
      ];
      severity: string;
    },
  ];
}

export interface Coding {
  system?: string;
  code: string;
  display?: string;
}

export function getConceptCoding(codings: Coding[]): Coding {
  return codings ? codings.find((c) => !('system' in c) || c.system === undefined) : null;
}

export function getConceptCodingDisplay(codings: Coding[]): string {
  return getConceptCoding(codings)?.display;
}

export function usePatientAllergies(patientUuid: string) {
  const { data, error, isLoading } = useSWR<{ data: AllergyIntoleranceResponse }, Error>(
    `${fhirBaseUrl}/AllergyIntolerance?patient=${patientUuid}`,
    openmrsFetch,
  );
  const allergies: Array<AllergyIntolerance> = useMemo(() => {
    const _allergies: Array<AllergyIntolerance> = [];
    if (data) {
      const entries = data?.data.entry;
      entries?.map((allergy) => {
        return _allergies.push(allergy.resource);
      });
    }
    return _allergies;
  }, [data]);

  const display = useMemo(() => {
    if (allergies?.length) return allergies.map((allergy) => getConceptCodingDisplay(allergy.code.coding)).join(', ');
    return null;
  }, [allergies]);

  return {
    allergies,
    totalAllergies: data?.data.total,
    error,
    isLoading,
    display,
  };
}

export function usePatientOrders(dischargeEncounterUuId: string) {
  const rep =
    'custom:(uuid,display,location:(display),encounterDatetime,visit:(uuid,display,encounters:(uuid,display,encounterType:(uuid,display),encounterDatetime,orders,obs)))';
  const { encounter, error, isLoading } = useEncounterDetails(dischargeEncounterUuId, rep);
  const { drugOrderEncounterType } = useConfig<WardConfigObject>();
  const orderEncounters = useMemo(() => {
    const encounters = (encounter?.visit?.encounters ?? []).filter(
      (enc) => enc.encounterType.uuid === drugOrderEncounterType,
    );
    return encounters;
  }, [encounter, drugOrderEncounterType]);
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

  return {
    isLoading,
    error,
    drugOrders: drugorder,
    testOrders: testorder,
    orderEncounters,
  };
}
