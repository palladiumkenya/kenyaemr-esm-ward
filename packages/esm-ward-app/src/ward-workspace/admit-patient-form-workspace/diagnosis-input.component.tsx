import { ComboBox } from '@carbon/react';
import React from 'react';
import { Control, Controller, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDiagnoses } from './patient-admission.resources';

type Props<T> = {
  control: Control<T>;
  name: Path<T>;
};
const DiagnosisInput = <T,>({ control, name }: Props<T>) => {
  const { t } = useTranslation();
  const { diagnoses, onSearchTermChange, isLoading } = useDiagnoses();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        return (
          <ComboBox
            id="diagnosis"
            invalid={error?.message}
            invalidText={error?.message}
            itemToString={(concept) => diagnoses.find((c) => c.uuid === concept)?.display ?? ''}
            items={diagnoses.map((d) => d.uuid)}
            placeholder={t('diagnosis', 'Diagnosis')}
            titleText={t('majorComplaintOrDiagnosis', 'Major Complaint/Diagnosis')}
            onInputChange={onSearchTermChange}
            type="default"
            selectedItem={value}
            helperText={isLoading ? 'Loading....' : undefined}
            onChange={({ selectedItem }) => {
              onChange(selectedItem);
            }}
          />
        );
      }}
    />
  );
};

export default DiagnosisInput;
