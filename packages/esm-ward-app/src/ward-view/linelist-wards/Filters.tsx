import React from 'react';
import styles from './linelist-wards.scss';
import { DatePicker, DatePickerInput } from '@carbon/react';
import { useTranslation } from 'react-i18next';
const Filters = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.filtersContainer}>
      <div>
        <DatePicker datePickerType="single" onChange={() => {}} onClose={() => {}} onOpen={() => {}}>
          <DatePickerInput
            id="date-picker-single"
            labelText={t('date', 'Date')}
            onChange={() => {}}
            onClose={() => {}}
            onOpen={() => {}}
            placeholder="mm/dd/yyyy"
          />
        </DatePicker>
      </div>
    </div>
  );
};

export default Filters;
