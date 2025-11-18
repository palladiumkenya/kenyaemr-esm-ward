import { ComboButton, MenuItem } from '@carbon/react';
import { evaluateAsBoolean, launchWorkspace, useConfig } from '@openmrs/esm-framework';
import { launchStartVisitPrompt } from '@openmrs/esm-patient-common-lib';
import dayjs from 'dayjs';
import React, { type FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type WardConfigObject } from '../config-schema';
import useCurrentPatientAdmissionEncounter from '../hooks/useCurrentPatientAdmissionEncounter';
import { useAdmissionLocationTags } from './in-patient.resource';
type InpatientFormsProps = {
  patientUuid: string;
  patient: fhir.Patient;
};
const InpatientForms: FC<InpatientFormsProps> = ({ patientUuid, patient }) => {
  const { t } = useTranslation();
  const { admissionEncounter, isLoading, error, currentVisit, isPatientAdmitted } =
    useCurrentPatientAdmissionEncounter(patientUuid);
  const {
    error: tagsError,
    isLoading: isloadingTags,
    tags,
  } = useAdmissionLocationTags(admissionEncounter?.location?.uuid);

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

  if (isloadingTags || isLoading) return null;

  return (
    <ComboButton size="sm" label={t('inPatientForms', 'In-Patient Forms')}>
      {filteredForms.map((form) => (
        <MenuItem key={form.uuid} onClick={() => handleLaunchForm(form)} label={form.label} />
      ))}
    </ComboButton>
  );
};

export default InpatientForms;
