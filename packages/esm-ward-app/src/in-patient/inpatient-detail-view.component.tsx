import { DataTableSkeleton, InlineLoading, Layer, Tile } from '@carbon/react';
import {
  ErrorState,
  formatDatetime,
  parseDate,
  useEmrConfiguration,
  usePatient,
  useVisit,
  type EmrApiConfigurationResponse,
} from '@openmrs/esm-framework';
import { CardHeader, EmptyDataIllustration } from '@openmrs/esm-patient-common-lib/src';
import dayjs from 'dayjs';
import React, { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdmissionLocation } from '../hooks/useAdmissionLocation';
import InpatientForms from './inpatient-forms.component';
import styles from './inpatient.scss';

type InpatientDetailViewProps = {
  patientUuid: string;
};

const InpatientDetailView: FC<InpatientDetailViewProps> = ({ patientUuid }) => {
  const { isLoading: isLoadingPatient, patient, error } = usePatient(patientUuid);
  const { isLoadingEmrConfiguration, emrConfiguration, errorFetchingEmrConfiguration } = useEmrConfiguration();
  const { isLoading: isLoadingActiveVisit, error: currVisistError, currentVisit } = useVisit(patientUuid);
  const { t } = useTranslation();
  if (isLoadingActiveVisit || isLoadingEmrConfiguration || isLoadingPatient) {
    return <DataTableSkeleton />;
  }

  if (error || errorFetchingEmrConfiguration || currVisistError) {
    return (
      <ErrorState
        error={error ?? errorFetchingEmrConfiguration ?? currVisistError}
        headerTitle={t('inpatientdetails', 'Inpatient Details')}
      />
    );
  }

  if (!currentVisit) {
    return (
      <Layer>
        <CardHeader title={t('inpatientdetails', 'Inpatient Details')}>
          <></>
        </CardHeader>
        <Tile className={styles.patientNotAdmitted}>
          <EmptyDataIllustration />
          <p>{t('noActiveVisit', 'This Patient Not currently admitted to ward')}</p>;
        </Tile>
      </Layer>
    );
  }

  return (
    <div>
      <PatientAdmitted patientUuid={patientUuid} patient={patient} emrConfiguration={emrConfiguration} />
    </div>
  );
};

export default InpatientDetailView;

const PatientAdmitted: FC<{
  patientUuid: string;
  patient: fhir.Patient;
  emrConfiguration: EmrApiConfigurationResponse;
}> = ({ emrConfiguration, patient, patientUuid }) => {
  const { currentVisit } = useVisit(patientUuid);
  const { t } = useTranslation();

  const { isPatientAdmitted, dateOfAdmission, dayasInWard, ward } = useMemo(() => {
    const hasAdmissionEncounter = currentVisit.encounters.find(
      (encounter) => encounter.encounterType.uuid === emrConfiguration?.admissionEncounterType?.uuid,
    );
    const hasDischargeEncounter = currentVisit.encounters.find(
      (encounter) => encounter.encounterType.uuid === emrConfiguration?.exitFromInpatientEncounterType?.uuid,
    );

    const dateOfAdmission = hasAdmissionEncounter?.encounterDatetime
      ? parseDate(hasAdmissionEncounter?.encounterDatetime)
      : null;

    const today = dayjs().startOf('day');
    const dayasInWard = dateOfAdmission ? Math.abs(today.diff(dateOfAdmission, 'days')) : 0;

    return {
      isPatientAdmitted: hasAdmissionEncounter && !hasDischargeEncounter,
      dateOfAdmission,
      dayasInWard,
      ward: hasAdmissionEncounter?.location,
    };
  }, [emrConfiguration, currentVisit]);
  const { isLoading, admissionLocation, error } = useAdmissionLocation(undefined, ward?.uuid);
  const bedLayout = useMemo(() => {
    return admissionLocation?.bedLayouts?.find((layout) => layout.patients?.some((pat) => pat?.uuid === patientUuid));
  }, [admissionLocation, patientUuid]);

  if (!isPatientAdmitted) {
    return (
      <Layer>
        <CardHeader title={t('admissionDetails', 'Admission Details')}>
          <></>
        </CardHeader>
        <Tile className={styles.patientNotAdmitted}>
          <EmptyDataIllustration />
          <p>{t('patientNotAdmitted', 'This Patient Not currently admitted to ward')}</p>;
        </Tile>
      </Layer>
    );
  }
  return (
    <Layer>
      <CardHeader title={t('admissionDetail', 'Admission Details')}>
        <InpatientForms patientUuid={patientUuid} patient={patient} emrConfiguration={emrConfiguration} />
      </CardHeader>
      <div className={styles.detailsContainer}>
        <Tile>
          <strong>{t('dateOfAdmission', 'Date of Admission')}</strong>
          <p>{formatDatetime(dateOfAdmission)}</p>
        </Tile>
        <Tile>
          <strong>{t('daysInWard', 'Days in ward')}</strong>
          <p>{dayasInWard}</p>
        </Tile>
        <Tile>
          <strong>{t('ward', 'Ward')}</strong>
          <p>{ward?.display}</p>
        </Tile>
        <Tile>
          {isLoading ? (
            <InlineLoading />
          ) : (
            <>
              <strong>{t('bed', 'Bed')}</strong>
              <p>{bedLayout?.bedNumber}</p>
            </>
          )}
        </Tile>
      </div>
    </Layer>
  );
};
