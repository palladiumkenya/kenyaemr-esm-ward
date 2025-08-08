import { InlineLoading, InlineNotification } from '@carbon/react';
import { useEmrConfiguration, usePatient, useSession } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import React, { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useEncounterDetails } from '../hooks/useIpdDischargeEncounter';
import styles from './discharge-printouts.scss';
import FieldInput from './field-input';
import { DATE_FORMART, TIME_FORMART } from './discharge-printout.resource';

type GatePassPrintoutProps = {
  dischargeEncounterUuid: string;
  patient: {
    uuid: string;
    openmrsId: string;
    name: string;
  };
};

const GatePassPrintout: FC<GatePassPrintoutProps> = ({ dischargeEncounterUuid, patient: _patient }) => {
  const { t } = useTranslation();

  const { encounter, error, isLoading } = useEncounterDetails(dischargeEncounterUuid);
  const { isLoading: isLoadingPatient, patient, error: patientError } = usePatient(_patient.uuid);
  const session = useSession();
  const { emrConfiguration, isLoadingEmrConfiguration, errorFetchingEmrConfiguration } = useEmrConfiguration();

  const admissionDate = useMemo(() => {
    const admisionEncounter = encounter?.visit?.encounters?.find(
      (e) => e.encounterType.uuid === emrConfiguration?.admissionEncounterType?.uuid,
    );
    if (!admisionEncounter || !admisionEncounter.encounterDatetime) return null;
    return admisionEncounter.encounterDatetime;
  }, [encounter, emrConfiguration]);

  if (isLoading || isLoadingPatient || isLoadingEmrConfiguration) return <InlineLoading />;
  if (error || patientError || errorFetchingEmrConfiguration)
    return (
      <InlineNotification
        kind="error"
        title={error?.message ?? patientError?.message ?? errorFetchingEmrConfiguration?.message}
      />
    );

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h5>{session?.sessionLocation?.display}</h5>
        <h5>{t('wardGatePass', 'Ward gate pass')}</h5>
      </div>
      <div className={styles.cols4}>
        <FieldInput name={t('paperNo', 'Paper No')} value={_patient.openmrsId} />
        <FieldInput name={t('patientNo', 'Patient No')} value={_patient.openmrsId} />
        <FieldInput name={t('date', 'Date')} value={dayjs().format(DATE_FORMART)} />
        <FieldInput name={t('time', 'Time')} value={dayjs().format(TIME_FORMART)} />
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('patientNames', 'Patient names')} value={_patient.name} />
        <FieldInput
          name={t('age', 'Age')}
          value={`${Math.abs(dayjs(patient.birthDate).diff(dayjs(), 'years'))} years`}
        />
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('dateOfAdmissionAbrv', 'DOA')} value={dayjs(admissionDate).format(DATE_FORMART)} />
        <FieldInput
          name={t('dateOfDischargeAbrv', 'DOD')}
          value={dayjs(encounter.encounterDatetime).format(DATE_FORMART)}
        />
      </div>

      <div>
        <p>{t('methodsOfPayment', 'Method of payment (tick as approximately)')}</p>
        <br />
        <div className={styles.cols7}>
          <span>{t('cashCheckBox', 'Cash [ ]')}</span>
          <span>{t('chequCheckBox', 'Cheque [ ]')}</span>
          <span>{t('shaCheckBox', 'SHA [ ]')}</span>
          <span>{t('scheme', 'Scheme [ ]')}</span>
          <span>{t('mrm', 'M.R.M [ ]')}</span>
          <FieldInput name={t('other', 'Other')} />
          <FieldInput name="." delimiter="." />
        </div>
      </div>
      <p>
        <strong>{t('approvedBy', 'Approved By')}</strong>
      </p>
      <div className={styles.cols4}>
        <FieldInput name={t('accountOfficer', 'Account Ofiicer')} />
        <FieldInput name="." delimiter="." />
        <FieldInput name={t('sign', 'Sign')} />
        <FieldInput name={t('date', 'Date')} />
      </div>
      <div className={styles.cols4}>
        <FieldInput name={t('healthRecordOfficer', 'Health Record Officer')} />
        <FieldInput name="." delimiter="." />
        <FieldInput name={t('sign', 'Sign')} />
        <FieldInput name={t('date', 'Date')} />
      </div>
      <div className={styles.cols4}>
        <FieldInput name={t('nurseInCharge', 'Nurse In Charge')} />
        <FieldInput name="." delimiter="." />
        <FieldInput name={t('sign', 'Sign')} />
        <FieldInput name={t('date', 'Date')} />
      </div>
      <div className={styles.cols4}>
        <FieldInput name={t('securityGuard', 'Security Guard')} />
        <FieldInput name="." delimiter="." />
        <FieldInput name={t('sign', 'Sign')} />
        <FieldInput name={t('date', 'Date')} />
      </div>
      <p>
        <strong>{t('note', 'N/B')}:</strong>
        <span>
          {t(
            'noteText',
            'This form should be filled in duplicate, one copy to be retained in the ward and the other to be left in the main gate',
          )}
        </span>
      </p>
    </div>
  );
};

export default GatePassPrintout;
