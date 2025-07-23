import { type Concept, restBaseUrl, useConfig, useDebounce, useOpenmrsFetchAll } from '@openmrs/esm-framework';
import { useMemo, useState } from 'react';
import z from 'zod';
import { type WardConfigObject } from '../../config-schema';
import dayjs from 'dayjs';
export const useDiagnoses = () => {
  const { diagnosisConceptSourceUud } = useConfig<WardConfigObject>();
  const [q, setQ] = useState('');
  const debouncedSearchTerm = useDebounce(q, 500);
  const rep =
    'custom:(uuid,name:(uuid,display),conceptClass:(uuid,display),setMembers,mappings:(conceptReferenceTerm:(code,name,display,conceptSource:(uuid))))';
  const url = `${restBaseUrl}/concept?q=${debouncedSearchTerm}&v=${rep}&references=${diagnosisConceptSourceUud}`;
  const { data, error, isLoading } = useOpenmrsFetchAll<Concept>(debouncedSearchTerm?.length >= 3 ? url : null);
  const diagnoses = useMemo(
    () =>
      (data ?? [])
        .filter(
          (c) => c.mappings?.some((m) => m?.conceptReferenceTerm?.conceptSource?.uuid === diagnosisConceptSourceUud),
        )
        .map((c) => {
          const code = c.mappings?.find(
            (m) => m?.conceptReferenceTerm?.conceptSource?.uuid === diagnosisConceptSourceUud,
          )?.conceptReferenceTerm?.code;

          return {
            display: `${code}-${c.name.display}`,
            uuid: c.uuid,
          };
        }),
    [data, diagnosisConceptSourceUud],
  );
  return {
    diagnoses,
    isLoading,
    error,
    searchTerm: q,
    onSearchTermChange: setQ,
  };
};

type Provider = {
  uuid: string;
  display: string;
};

export const useProviders = () => {
  const url = `${restBaseUrl}/provider?v=custom:(uuid,display)`;
  const { data, error, isLoading } = useOpenmrsFetchAll<Provider>(url);
  return {
    providers: data ?? [],
    error,
    isLoading,
  };
};

export const inpatientAdmissionSchema = z.object({
  bedId: z.number().optional(),
  admissionDate: z.date({ coerce: true }),
  diagnosis: z.string().optional(),
  primaryDoctor: z.string().optional(),
  primaryDoctorPhoneNumber: z.string().optional(),
  emergencyDoctor: z.string().optional(),
  emergencyDoctorPhoneNumber: z.string().optional(),
  paymentMode: z.string().optional(),
  insuranceType: z.string().optional(),
  otherInsuranceType: z.string().optional(),
});

const formartDate = (date: Date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '';
};

export type InapatientAdmissionFormData = z.infer<typeof inpatientAdmissionSchema>;
export const formValuesToObs = (data: InapatientAdmissionFormData, config: WardConfigObject) => {
  const obs = [
    {
      concept: config.conceptUuidForWardAdmission.admissionDateTime,
      value: formartDate(data?.admissionDate),
    },
    {
      concept: config.conceptUuidForWardAdmission.primaryDoctor,
      value: data.primaryDoctor,
    },
    {
      concept: config.conceptUuidForWardAdmission.chiefComplaint,
      value: data.diagnosis,
    },
    {
      concept: config.conceptUuidForWardAdmission.primaryDoctorPhoneNumber,
      value: data.primaryDoctorPhoneNumber,
    },
    {
      concept: config.conceptUuidForWardAdmission.emmergencyDoctor,
      value: data.emergencyDoctor,
    },
    {
      concept: config.conceptUuidForWardAdmission.emmergencyDoctorPhoneNumber,
      value: data.emergencyDoctorPhoneNumber,
    },
    {
      concept: config.conceptUuidForWardAdmission.paymentMethod,
      value: data.paymentMode,
    },
  ];
  if (data.paymentMode === config.conceptUuidForWardAdmission.insurancePaymentMethod) {
    obs.push({
      concept: config.conceptUuidForWardAdmission.insurancePaymentMethod,
      value: data.insuranceType,
    });
    if (data.otherInsuranceType === config.conceptUuidForWardAdmission.otherInsuaranceType) {
      obs.push({
        concept: config.conceptUuidForWardAdmission.insuranceOtherSpecify,
        value: data.otherInsuranceType,
      });
    }
  }
  return obs.filter((o) => Boolean(o.value));
};
