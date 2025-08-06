import React, { type FC, useMemo } from 'react';
import styles from './discharge-printouts.scss';
import FieldInput from './field-input';
import { useTranslation } from 'react-i18next';
import { useEmrConfiguration, usePatient, useSession } from '@openmrs/esm-framework';
import { useEncounterDetails } from '../hooks/useIpdDischargeEncounter';
import { InlineLoading , InlineNotification } from '@carbon/react';
import dayjs from 'dayjs';

type DischargeSummaryProps = {
  dischargeEncounterUuid: string;
  patient: {
    uuid: string;
    openmrsId: string;
    name: string;
  };
};
const DATE_FORMART = 'DD/MM/YYYY';

const DischargeSummary: FC<DischargeSummaryProps> = ({ dischargeEncounterUuid, patient: _patient }) => {
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
        <FieldInput name={t('nameOfConsultant', 'Name of consultant')} value={'Ann Waiguru'} />
        <FieldInput name={t('department', 'Department')} value={encounter.location?.display} />
      </div>

      <div>
        <strong className={styles.txtUpper}>{t('diagnosis', 'Diagnosis')}</strong>
        <p>Community aquired Pneumonia, Right Lowe Lob</p>
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('history', 'History')}</strong>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Alias error repellat fugit iure aliquid dicta esse,
          fugiat voluptates suscipit officiis, veniam, quidem repellendus harum aut hic deserunt natus magni libero?
        </p>
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('physicalExamination', 'Physical Examination')}</strong>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Alias error repellat fugit iure aliquid dicta esse,
          fugiat voluptates suscipit officiis, veniam, quidem repellendus harum aut hic deserunt natus magni libero?
        </p>
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('investigation', 'Investigation')}</strong>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Alias error repellat fugit iure aliquid dicta esse,
          fugiat voluptates suscipit officiis, veniam, quidem repellendus harum aut hic deserunt natus magni libero?
        </p>
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('treatment', 'Treatment')}</strong>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Alias error repellat fugit iure aliquid dicta esse,
          fugiat voluptates suscipit officiis, veniam, quidem repellendus harum aut hic deserunt natus magni libero?
        </p>
      </div>
      <div>
        <strong className={styles.txtUpper}>{t('dischargeInstructions', 'Discharge Instructions')}</strong>
        <p>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Alias error repellat fugit iure aliquid dicta esse,
          fugiat voluptates suscipit officiis, veniam, quidem repellendus harum aut hic deserunt natus magni libero?
        </p>
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('name', 'Name')} value={'Ann Waiguru'} />
        <FieldInput name={t('signature', 'Signature')} />
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('destination', 'Destination')} value={t('discharge', 'Discharge')} />
        <FieldInput name={t('date', 'Date')} value="12/06/2024" />
      </div>
    </div>
  );
};

export default DischargeSummary;
