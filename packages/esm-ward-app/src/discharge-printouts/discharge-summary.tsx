import { InlineLoading, InlineNotification } from '@carbon/react';
import { useEmrConfiguration, usePatient, useSession } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import React, { type FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useEncounterDetails } from '../hooks/useIpdDischargeEncounter';
import { useProvider } from '../ward-workspace/admit-patient-form-workspace/patient-admission.resources';
import {
  DATE_FORMART,
  getTreatmentDisplayText,
  usePatientDiagnosis,
  usePatientOrders,
} from './discharge-printout.resource';
import styles from './discharge-printouts.scss';
import FieldInput from './field-input';
import LabResults from './lab-results';

type DischargeSummaryProps = {
  dischargeEncounterUuid: string;
  patient: {
    uuid: string;
    openmrsId: string;
    name: string;
  };
};

const DischargeSummary: FC<DischargeSummaryProps> = ({ dischargeEncounterUuid, patient: _patient }) => {
  const { t } = useTranslation();
  const { encounter, error, isLoading } = useEncounterDetails(dischargeEncounterUuid);
  const { isLoading: isLoadingPatient, patient, error: patientError } = usePatient(_patient.uuid);
  const {
    isLoading: isLoadingDiagnosis,
    error: diagnosisError,
    display: diagnoses,
  } = usePatientDiagnosis(dischargeEncounterUuid);
  const session = useSession();
  const { error: errorProvider, isLoading: isLoadingProvider, provider } = useProvider(session.currentProvider.uuid);
  const { emrConfiguration, isLoadingEmrConfiguration, errorFetchingEmrConfiguration } = useEmrConfiguration();
  const {
    isLoading: isLoadingOders,
    error: orderserror,
    drugOrders,
    testOrders,
    complaints,
    drugReactions,
    orderEncounters,
    dischargeinstructions,
    physicalExaminations,
  } = usePatientOrders(dischargeEncounterUuid);
  const admissionDate = useMemo(() => {
    const admisionEncounter = encounter?.visit?.encounters?.find(
      (e) => e.encounterType.uuid === emrConfiguration?.admissionEncounterType?.uuid,
    );
    if (!admisionEncounter || !admisionEncounter.encounterDatetime) return null;
    return admisionEncounter.encounterDatetime;
  }, [encounter, emrConfiguration]);

  if (
    isLoading ||
    isLoadingPatient ||
    isLoadingEmrConfiguration ||
    isLoadingDiagnosis ||
    isLoadingProvider ||
    isLoadingOders
  )
    return <InlineLoading />;
  if (error || patientError || errorFetchingEmrConfiguration || diagnosisError || errorProvider || orderserror)
    return (
      <InlineNotification
        kind="error"
        title={
          error?.message ??
          patientError?.message ??
          errorFetchingEmrConfiguration?.message ??
          diagnosisError?.message ??
          errorProvider?.message ??
          orderserror?.message
        }
      />
    );
  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h5>{session.sessionLocation.display}</h5>
        <h5>{t('dischargeSummary', 'Discharge Summary')}</h5>
      </div>
      <div className={styles.cols3}>
        <FieldInput name={t('name', 'Name')} value={_patient.name} />
        <FieldInput name={t('ipNo', 'IP No')} value={_patient.openmrsId} />
        <FieldInput
          name={t('age', 'Age')}
          value={`${Math.abs(dayjs(patient.birthDate).diff(dayjs(), 'years'))} years`}
        />
      </div>
      <div className={styles.cols3}>
        <FieldInput name={t('sex', 'Sex')} value={patient.gender} />
        <FieldInput name={t('dateOfAdmissionAbrv', 'DOA')} value={dayjs(admissionDate).format(DATE_FORMART)} />
        <FieldInput
          name={t('dateOfDischargeAbrv', 'DOD')}
          value={dayjs(encounter.encounterDatetime).format(DATE_FORMART)}
        />
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('nameOfConsultant', 'Name of consultant')} value={provider?.display?.split('-')?.at(-1)} />
        <FieldInput name={t('department', 'Department')} value={encounter.location?.display} />
      </div>

      <div>
        <strong className={styles.txtUpper}>{t('diagnosis', 'Diagnosis')}</strong>
        <p className={styles.txtTitle}>{diagnoses ?? t('noDiagnoses', 'No Diagnoses')}</p>
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('history', 'History')}</strong>
        <p>
          {`${complaints ? 'Presented with ' + complaints + '.' : ''}${
            drugReactions
              ? t('knownDrugAllergies', 'Known drug allergies') + ': ' + drugReactions
              : t('noKnownDrugAllergies', 'No known drug allergies')
          }`}
        </p>
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('physicalExamination', 'Physical Examination')}</strong>
        {physicalExaminations?.length ? (
          physicalExaminations?.map((examination, i) => (
            <p key={i} className={styles.txtTitle}>
              {examination}
            </p>
          ))
        ) : (
          <p>{t('noExaminations', 'No Examinations')}</p>
        )}
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('investigation', 'Investigation')}</strong>
        <p>
          {testOrders.map((order) => (
            <LabResults
              order={order}
              key={order.uuid}
              labEncounter={orderEncounters.find((e) => e.uuid === order.encounter.uuid) as any}
            />
          ))}
        </p>
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('treatment', 'Treatment')}</strong>
        <div>
          {drugOrders.map((order) => (
            <p key={order.uuid}>{getTreatmentDisplayText(order)}</p>
          ))}
        </div>
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('dischargeInstructions', 'Discharge Instructions')}</strong>
        <p>{dischargeinstructions ?? t('noInstructions', 'No instructions')}</p>
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('name', 'Name')} value={provider?.display?.split('-')?.at(-1)} />
        <FieldInput name={t('signature', 'Signature')} />
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('destination', 'Destination')} value={t('discharge', 'Discharge')} />
        <FieldInput name={t('date', 'Date')} value={dayjs().format(DATE_FORMART)} />
      </div>
    </div>
  );
};

export default DischargeSummary;
