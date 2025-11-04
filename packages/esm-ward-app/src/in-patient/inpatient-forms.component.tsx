import { ComboButton, Dropdown, MenuItem } from '@carbon/react';
import React, { type FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type EmrApiConfigurationResponse,
  evaluateAsBoolean,
  launchWorkspace,
  useConfig,
  useVisit,
} from '@openmrs/esm-framework';
import { launchStartVisitPrompt } from '@openmrs/esm-patient-common-lib';
import dayjs from 'dayjs';
import { type WardConfigObject } from '../config-schema';
import { useAdmissionLocationTags } from './in-patient.resource';
type InpatientFormsProps = {
  patientUuid: string;
  patient: fhir.Patient;
  emrConfiguration: EmrApiConfigurationResponse;
};
const InpatientForms: FC<InpatientFormsProps> = ({ patientUuid, patient, emrConfiguration }) => {
  const { t } = useTranslation();
  const { currentVisit } = useVisit(patientUuid);
  const admissionLocation = useMemo(
    () =>
      currentVisit?.encounters?.find((en) => en.encounterType?.uuid === emrConfiguration?.admissionEncounterType?.uuid)
        ?.location,
    [currentVisit?.encounters, emrConfiguration?.admissionEncounterType?.uuid],
  );
  const { error: tagsError, isLoading: isloadingTags, tags } = useAdmissionLocationTags(admissionLocation?.uuid);

  const { inPatientForms } = useConfig<WardConfigObject>();
  const filteredForms = useMemo(
    () =>
      inPatientForms.filter((form) => {
        const age = dayjs().diff(dayjs(patient.birthDate), 'year');
        const ageInDays = dayjs().diff(dayjs(patient.birthDate), 'day');
        const ageInMonths = dayjs().diff(dayjs(patient.birthDate), 'month');
        const gender = patient.gender;

        const shouldHideBasedOnExpression = form.hideExpression
          ? evaluateAsBoolean(form.hideExpression, { age, gender, ageInDays, ageInMonths })
          : false;

        const shouldHideBasedOnTags = form.tags?.length
          ? !form.tags.some((tag) => tags.some((t) => t.uuid === tag.uuid))
          : false;

        // Keep the form if it should NOT be hidden by either condition
        return !shouldHideBasedOnExpression && !shouldHideBasedOnTags;
      }),
    [inPatientForms, patient.birthDate, patient.gender, tags],
  );

  const isPatientAdmitted = useMemo(() => {
    const hasAdmissionEncounter = currentVisit.encounters.some(
      (encounter) => encounter.encounterType.uuid === emrConfiguration?.admissionEncounterType?.uuid,
    );
    const hasDischargeEncounter = currentVisit.encounters.some(
      (encounter) => encounter.encounterType.uuid === emrConfiguration?.exitFromInpatientEncounterType?.uuid,
    );
    return hasAdmissionEncounter && !hasDischargeEncounter;
  }, [emrConfiguration, currentVisit]);

  const handleLaunchForm = (form: { label: string; uuid: string }) => {
    if (!currentVisit) {
      return launchStartVisitPrompt();
    }
    const filledFormEncounter = currentVisit?.encounters?.find((en) => en?.form?.uuid === form.uuid);
    launchWorkspace('patient-form-entry-workspace', {
      workspaceTitle: form.label,
      mutateForm: () => {},
      formInfo: {
        encounterUuid: filledFormEncounter?.uuid ?? '',
        formUuid: form.uuid,
        additionalProps: {},
      },
    });
  };

  if (!isPatientAdmitted) {
    return null;
  }

  if (isloadingTags) return null;
  return (
    <ComboButton size="sm" label={t('inPatientForms', 'In-Patient Forms')}>
      {filteredForms.map((form) => (
        <MenuItem key={form.uuid} onClick={() => handleLaunchForm(form)} label={form.label} />
      ))}
    </ComboButton>
  );
};

export default InpatientForms;
