import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineLoading, InlineNotification } from '@carbon/react';
import {
  DefaultWorkspaceProps,
  Encounter,
  ExtensionSlot,
  useEmrConfiguration,
  usePatient,
} from '@openmrs/esm-framework';
import { useVisitOrOfflineVisit } from '@openmrs/esm-patient-common-lib';
import { usePatientDischarge } from './patient-discharge.resource';
import { WardPatient } from '../../types';

type PatientDischargeWorkspaceProps = DefaultWorkspaceProps & {
  readonly patientUuid: string;
  readonly wardPatient: WardPatient;
  readonly formUuid: string;
  readonly dischargePatientOnSuccesfullSubmission?: boolean;
};

export function PatientDischargeWorkspace(props: PatientDischargeWorkspaceProps) {
  const { t } = useTranslation();
  const {
    patientUuid,
    closeWorkspace,
    closeWorkspaceWithSavedChanges,
    wardPatient,
    promptBeforeClosing,
    formUuid,
    dischargePatientOnSuccesfullSubmission = true,
  } = props;
  const { visit: currentVisit } = wardPatient ?? {};
  const { patient, isLoading: isLoadingPatient, error: patientError } = usePatient(patientUuid);
  const { emrConfiguration, isLoadingEmrConfiguration, errorFetchingEmrConfiguration } = useEmrConfiguration();

  const { handleDischarge } = usePatientDischarge();


  const state = useMemo<Record<string, unknown>>(
    () => ({
      view: 'form',
      formUuid,
      visitUuid: currentVisit?.uuid ?? null,
      visitTypeUuid: currentVisit?.visitType?.uuid ?? null,
      patientUuid: patientUuid ?? null,
      patient,
      encounterUuid:'',
      closeWorkspaceWithSavedChanges,
      closeWorkspace,
      promptBeforeClosing,
      handlePostResponse: (encounter: Encounter) => {
        if (dischargePatientOnSuccesfullSubmission)
          handleDischarge(encounter, wardPatient, emrConfiguration as Record<string, unknown>, currentVisit);
      },
    }),
    [
      patientUuid,
      currentVisit,
      patient,
      closeWorkspace,
      promptBeforeClosing,
      emrConfiguration,
      closeWorkspaceWithSavedChanges,
      handleDischarge,
      dischargePatientOnSuccesfullSubmission,
    ],
  );

  const isLoading = isLoadingPatient || isLoadingEmrConfiguration;
  const error = patientError || errorFetchingEmrConfiguration;

  if (isLoading) {
    return <InlineLoading description={t('loading', 'Loading')} iconDescription={t('loading', 'Loading data...')} />;
  }

  if (error) {
    return (
      <InlineNotification
        aria-label={t('error', 'Error')}
        kind="error"
        onClose={() => {}}
        onCloseButtonClick={() => {}}
        statusIconDescription="notification"
        subtitle={t('errorLoadingPatientWorkspace', 'Error loading patient workspace {{errorMessage}}', {
          errorMessage: error?.message,
        })}
        title={t('error', 'Error')}
      />
    );
  }

  return (
    <div>
      {/* <pre>{JSON.stringify(currentVisit, null, 2)}</pre> */}
      {patient && <ExtensionSlot name="form-widget-slot" state={state} />}
    </div>
  );
}

export default PatientDischargeWorkspace;
