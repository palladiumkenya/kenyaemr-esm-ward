import { DataTableSkeleton, InlineLoading, Layer, Tile } from '@carbon/react';
import {
  ErrorState,
  formatDatetime,
  parseDate,
  useConfig,
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
import { type WardConfigObject } from '../config-schema';
import useCurrentPatientAdmissionEncounter from '../hooks/useCurrentPatientAdmissionEncounter';

type InpatientDetailViewProps = {
  patientUuid: string;
};

const InpatientDetailView: FC<InpatientDetailViewProps> = ({ patientUuid }) => {
  const { isLoading: isLoadingPatient, patient, error } = usePatient(patientUuid);
  const {
    admissionEncounter,
    isLoading: isLoadingAdmissionEncounter,
    error: errorAdmissionEncounter,
    currentVisit,
    isPatientAdmitted,
  } = useCurrentPatientAdmissionEncounter(patientUuid);
  const { inPatientVisitTypeUuid } = useConfig<WardConfigObject>();
  const { t } = useTranslation();
  if (isLoadingAdmissionEncounter || isLoadingPatient) {
    return <DataTableSkeleton />;
  }

  if (error || errorAdmissionEncounter) {
    return (
      <ErrorState error={error ?? errorAdmissionEncounter} headerTitle={t('inpatientdetails', 'Inpatient Details')} />
    );
  }

  if (!currentVisit || currentVisit?.visitType?.uuid !== inPatientVisitTypeUuid) {
    return (
      <Layer>
        <CardHeader title={t('inpatientdetails', 'Inpatient Details')}>
          <></>
        </CardHeader>
        <Tile className={styles.patientNotAdmitted}>
          <EmptyDataIllustration />
          <p>{t('noActiveVisit', 'This Patient Not currently admitted to ward')}</p>
        </Tile>
      </Layer>
    );
  }

  return (
    <div>
      <PatientAdmitted patientUuid={patientUuid} patient={patient} />
    </div>
  );
};

export default InpatientDetailView;

const PatientAdmitted: FC<{
  patientUuid: string;
  patient: fhir.Patient;
}> = ({ patient, patientUuid }) => {
  const { admissionEncounter, isPatientAdmitted } = useCurrentPatientAdmissionEncounter(patientUuid);
  const { t } = useTranslation();

  const { dateOfAdmission, dayasInWard } = useMemo(() => {
    const dateOfAdmission = admissionEncounter?.encounterDatetime
      ? parseDate(admissionEncounter?.encounterDatetime)
      : null;

    const today = dayjs().startOf('day');
    const dayasInWard = dateOfAdmission ? Math.abs(today.diff(dateOfAdmission, 'days')) : 0;

    return {
      dateOfAdmission,
      dayasInWard,
    };
  }, [admissionEncounter?.encounterDatetime]);
  const { isLoading, admissionLocation, error } = useAdmissionLocation(undefined, admissionEncounter?.location?.uuid);
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
        <InpatientForms patientUuid={patientUuid} patient={patient} />
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
          <p>{admissionEncounter?.location?.display}</p>
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
