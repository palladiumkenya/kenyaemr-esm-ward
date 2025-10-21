import {
  Button,
  ButtonSet,
  Column,
  ComboBox,
  DatePicker,
  DatePickerInput,
  Dropdown,
  Form,
  InlineNotification,
  RadioButton,
  RadioButtonGroup,
  Row,
  Stack,
  TextInput,
} from '@carbon/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { showSnackbar, useAppContext, useConfig } from '@openmrs/esm-framework';
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { type WardConfigObject } from '../../config-schema';
import { useAssignedBedByPatient } from '../../hooks/useAssignedBedByPatient';
import useWardLocation from '../../hooks/useWardLocation';
import type { WardPatientWorkspaceProps, WardViewContext } from '../../types';
import { assignPatientToBed, removePatientFromBed, useAdmitPatient } from '../../ward.resource';
import BedSelector from '../bed-selector.component';
import WardPatientWorkspaceBanner from '../patient-banner/patient-banner.component';
import styles from './admit-patient-form.scss';
import DiagnosisInput from './diagnosis-input.component';
import {
  formValuesToObs,
  type InapatientAdmissionFormData,
  inpatientAdmissionSchema,
  useProviders,
} from './patient-admission.resources';

/**
 * This form gets rendered when the user clicks "admit patient" in
 * the patient card in the admission requests workspace, but only when
 * the bed management module is installed. It asks to (optionally) select
 * a bed to assign to patient
 */
const AdmitPatientFormWorkspace: React.FC<WardPatientWorkspaceProps> = ({
  wardPatient,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
}) => {
  const { patient, inpatientRequest, visit } = wardPatient ?? {};
  const dispositionType = inpatientRequest?.dispositionType ?? 'ADMIT';
  const config = useConfig<WardConfigObject>();
  const { t } = useTranslation();
  const { location } = useWardLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { admitPatient, isLoadingEmrConfiguration, errorFetchingEmrConfiguration } = useAdmitPatient();
  const [showErrorNotifications, setShowErrorNotifications] = useState(false);
  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};
  const { isLoading } = wardPatientGroupDetails?.admissionLocationResponse ?? {};

  const { data: bedsAssignedToPatient, isLoading: isLoadingBedsAssignedToPatient } = useAssignedBedByPatient(
    patient.uuid,
  );
  const beds = isLoading ? [] : (wardPatientGroupDetails?.bedLayouts ?? []);

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    watch,
  } = useForm<InapatientAdmissionFormData>({
    defaultValues: { admissionDate: new Date() },
    resolver: zodResolver(inpatientAdmissionSchema),
  });
  const { isLoading: isLoadingProviders, providers } = useProviders();
  const [paymentMethodObservable, insuaranceTypeObservable, bedIdObservable] = watch([
    'paymentMode',
    'insuranceType',
    'bedId',
  ]);

  useEffect(() => {
    promptBeforeClosing(() => isDirty);
  }, [isDirty, promptBeforeClosing]);

  const onSubmit = (values: InapatientAdmissionFormData) => {
    setShowErrorNotifications(false);
    setIsSubmitting(true);
    const bedSelected = beds.find((bed) => bed.bedId === values.bedId);
    const obs = formValuesToObs(values, config);
    admitPatient(patient, dispositionType, visit.uuid, obs, values.admissionDate)
      .then(
        async (response) => {
          if (response.ok) {
            if (bedSelected) {
              return assignPatientToBed(values.bedId, patient.uuid, response.data.uuid);
            } else {
              const assignedBedId = bedsAssignedToPatient?.data?.results?.[0]?.bedId;
              if (assignedBedId) {
                return removePatientFromBed(assignedBedId, patient.uuid);
              }
              return response;
            }
          }
        },
        (err: any) => {
          if (err?.responseBody?.error?.fieldErrors?.encounterDatetime?.length) {
            showSnackbar({
              kind: 'error',
              title: t('errorCreatingEncounter', 'Failed to admit patient'),
              subtitle: err?.responseBody?.error?.fieldErrors?.encounterDatetime
                ?.map((e: any) => e.message)
                ?.join(', '),
            });
          } else
            showSnackbar({
              kind: 'error',
              title: t('errorCreatingEncounter', 'Failed to admit patient'),
              subtitle: err.message,
            });
        },
      )
      .then(
        (response) => {
          if (response && response?.ok) {
            if (bedSelected) {
              showSnackbar({
                kind: 'success',
                title: t('patientAdmittedSuccessfully', 'Patient admitted successfully'),
                subtitle: t(
                  'patientAdmittedSuccessfullySubtitle',
                  '{{patientName}} has been successfully admitted and assigned to bed {{bedNumber}}',
                  {
                    patientName: patient.person.preferredName.display,
                    bedNumber: bedSelected.bedNumber,
                  },
                ),
              });
            } else {
              showSnackbar({
                kind: 'success',
                title: t('patientAdmittedSuccessfully', 'Patient admitted successfully'),
                subtitle: t('patientAdmittedWoBed', 'Patient admitted successfully to {{location}}', {
                  location: location?.display,
                }),
              });
            }
          }
        },
        () => {
          showSnackbar({
            kind: 'warning',
            title: t('patientAdmittedSuccessfully', 'Patient admitted successfully'),
            subtitle: t(
              'patientAdmittedButBedNotAssigned',
              'Patient admitted successfully but fail to assign bed to patient',
            ),
          });
        },
      )
      .finally(() => {
        setIsSubmitting(false);
        wardPatientGroupDetails?.mutate?.();
        closeWorkspaceWithSavedChanges();
      });
  };

  const onError = useCallback((values) => {
    setShowErrorNotifications(true);
    setIsSubmitting(false);
  }, []);

  if (!wardPatientGroupDetails) return <></>;

  return (
    <Form control={control} className={styles.form} onSubmit={handleSubmit(onSubmit, onError)}>
      <Stack gap={4} className={styles.grid}>
        <WardPatientWorkspaceBanner {...{ wardPatient }} />
        <Column>
          <Controller
            control={control}
            name="admissionDate"
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              return (
                <DatePicker
                  value={value}
                  datePickerType="single"
                  onChange={([date]) => {
                    onChange(date);
                  }}
                  className={styles.datePickerInput}>
                  <DatePickerInput
                    id="admission-date"
                    labelText={t('admissionDate', 'Admission Date')}
                    placeholder="mm/dd/yyyy"
                    invalid={error?.message}
                    invalidText={error?.message}
                  />
                </DatePicker>
              );
            }}
          />
        </Column>
        <Column>
          <DiagnosisInput control={control} name={'diagnosis'} />
        </Column>
        <Column>
          <Controller
            control={control}
            name="primaryDoctor"
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              return (
                <ComboBox
                  id="primary-doctor"
                  invalid={error?.message}
                  helperText={isLoadingProviders ? 'Loading....' : undefined}
                  invalidText={error?.message}
                  itemToString={(provider) => providers.find((p) => p.uuid === provider)?.display ?? ''}
                  items={providers.map((p) => p.uuid)}
                  selectedItem={value}
                  onChange={({ selectedItem }) => onChange(selectedItem)}
                  placeholder={t('primaryDoctor', 'Primary Doctor')}
                  titleText={t('primaryDoctor', 'Primary Doctor')}
                  type="default"
                />
              );
            }}
          />
        </Column>
        <Column>
          <Controller
            control={control}
            name="primaryDoctorPhoneNumber"
            render={({ field, fieldState: { error } }) => {
              return (
                <TextInput
                  {...field}
                  invalid={error?.message}
                  invalidText={error?.message}
                  id="primary-doctor-phone-number"
                  labelText={t('primaryDoctorPhoneNumber', 'Primary doctor phone number')}
                  placeholder={t('phoneNumber', 'Phone number')}
                  size="md"
                  type="text"
                />
              );
            }}
          />
        </Column>
        <Column>
          <Controller
            control={control}
            name="emergencyDoctor"
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              return (
                <ComboBox
                  id="emergency-doctor"
                  invalid={error?.message}
                  helperText={isLoadingProviders ? 'Loading....' : undefined}
                  invalidText={error?.message}
                  itemToString={(provider) => providers.find((p) => p.uuid === provider)?.display ?? ''}
                  items={providers.map((p) => p.uuid)}
                  selectedItem={value}
                  onChange={({ selectedItem }) => onChange(selectedItem)}
                  placeholder={t('emergencyDoctor', 'Emergence Doctor')}
                  titleText={t('emergencyDoctor', 'Emergency Doctor')}
                  type="default"
                />
              );
            }}
          />
        </Column>
        <Column>
          <Controller
            control={control}
            name="emergencyDoctorPhoneNumber"
            render={({ field, fieldState: { error } }) => {
              return (
                <TextInput
                  {...field}
                  invalid={error?.message}
                  invalidText={error?.message}
                  id="emergency-doctor-phone-number"
                  labelText={t('emergencyDoctorPhoneNumber', 'Emergency doctor phone number')}
                  placeholder={t('phoneNumber', 'Phone number')}
                  size="md"
                  type="text"
                />
              );
            }}
          />
        </Column>
        <Column>
          <Controller
            control={control}
            name="paymentMode"
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              return (
                <RadioButtonGroup
                  legendText={t('paymentMode', 'Payment mode')}
                  name="payment-mode"
                  defaultSelected={value}
                  invalid={error?.message}
                  invalidText={error?.message}
                  onChange={onChange}
                  orientation="vertical">
                  <RadioButton
                    labelText={t('cash', 'Cash')}
                    value={config.conceptUuidForWardAdmission.cashPaymentMethod}
                  />
                  <RadioButton
                    labelText={t('mpesa', 'MPESA')}
                    value={config.conceptUuidForWardAdmission.mpesaPaymentMethod}
                  />
                  <RadioButton
                    labelText={t('insuarance', 'Insuarance')}
                    value={config.conceptUuidForWardAdmission.insurancePaymentMethod}
                  />
                </RadioButtonGroup>
              );
            }}
          />
        </Column>
        {paymentMethodObservable === config.conceptUuidForWardAdmission.insurancePaymentMethod && (
          <Column>
            <Controller
              control={control}
              name="insuranceType"
              render={({ field: { onChange, value }, fieldState: { error } }) => {
                return (
                  <Dropdown
                    invalid={error?.message}
                    invalidText={error?.message}
                    selectedItem={value}
                    onChange={({ selectedItem }) => onChange(selectedItem)}
                    id="insurance-type"
                    itemToString={(concept) =>
                      config.insuaranceTypes.find((type) => type.concept === concept)?.label ?? ''
                    }
                    items={config.insuaranceTypes.map((type) => type.concept)}
                    label={t('insuranceType', 'Insurance type')}
                    titleText={t('insuranceType', 'Insurance type')}
                    type="default"
                  />
                );
              }}
            />
          </Column>
        )}
        {paymentMethodObservable === config.conceptUuidForWardAdmission.insurancePaymentMethod &&
          insuaranceTypeObservable === config.conceptUuidForWardAdmission.otherInsuaranceType && (
            <Column>
              <Controller
                control={control}
                name="otherInsuranceType"
                render={({ field, fieldState: { error } }) => {
                  return (
                    <TextInput
                      {...field}
                      invalid={error?.message}
                      invalidText={error?.message}
                      id="other-insurance-type"
                      labelText={t('otherInsuranceType', 'Other Insurance Type')}
                      placeholder={t('pleaseSpecify', 'Please specify')}
                      size="md"
                      type="text"
                    />
                  );
                }}
              />
            </Column>
          )}
        <Column>
          <Controller
            control={control}
            name="bedId"
            render={({ field: { onChange, value }, fieldState: { error } }) => {
              return (
                <BedSelector
                  beds={beds}
                  isLoadingBeds={isLoading}
                  currentPatient={patient}
                  selectedBedId={value}
                  error={error}
                  control={control}
                  onChange={onChange}
                />
              );
            }}
          />
        </Column>
        <Column>
          <TextInput
            value={beds?.find((b) => b.bedId === bedIdObservable)?.bedType?.displayName ?? ''}
            readOnly
            labelText={t('bedType', 'Bed type')}
            placeholder={t('notConfigured', 'Bed type not configured')}
          />
        </Column>

        <Column>
          <div className={styles.errorNotifications}>
            {showErrorNotifications &&
              Object.entries(errors).map(([key, value]) => {
                return (
                  <Row key={key}>
                    <Column>
                      <InlineNotification kind="error" subtitle={value.message} lowContrast />
                    </Column>
                  </Row>
                );
              })}
          </div>
        </Column>
      </Stack>

      <ButtonSet className={styles.buttonSet}>
        <Button
          className={styles.button}
          size="xl"
          kind="secondary"
          onClick={() => closeWorkspace({ ignoreChanges: true })}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button
          className={styles.button}
          type="submit"
          size="xl"
          disabled={
            isSubmitting ||
            isLoadingEmrConfiguration ||
            errorFetchingEmrConfiguration ||
            isLoading ||
            isLoadingBedsAssignedToPatient
          }>
          {!isSubmitting ? t('admit', 'Admit') : t('admitting', 'Admitting...')}
        </Button>
      </ButtonSet>
    </Form>
  );
};

export default AdmitPatientFormWorkspace;
