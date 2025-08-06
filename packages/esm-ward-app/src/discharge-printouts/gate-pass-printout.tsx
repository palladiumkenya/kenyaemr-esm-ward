import React, { type FC } from 'react';
import styles from './discharge-printouts.scss';
import FieldInput from './field-input';
import { useTranslation } from 'react-i18next';
import { useSession } from '@openmrs/esm-framework';
const GatePassPrintout = () => {
  const { t } = useTranslation();
  const session = useSession();
  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h5>{session?.sessionLocation?.display}</h5>
        <h5>{t('wardGatePass', 'Ward gate pass')}</h5>
      </div>
      <div className={styles.cols4}>
        <FieldInput name={t('paperNo', 'Paper No')} value={'345re34'} />
        <FieldInput name={t('patientNo', 'Patient No')} value={'1234edee4'} />
        <FieldInput name={t('date', 'Date')} value={'11/07/2021'} />
        <FieldInput name={t('time', 'Time')} />
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('patientNames', 'Patient names')} value={'Joyce Kamau'} />
        <FieldInput name={t('age', 'Age')} value={'30 years'} />
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('dateOfAdmissionAbrv', 'DOA')} value={'02/07/2021'} />
        <FieldInput name={t('dateOfDischargeAbrv', 'DOD')} value={'02/07/2021'} />
      </div>

      <div>
        <p>{t('methodsOfPayment', 'Method of payment (tick as approximately)')}</p>
        <br />
        <div className={styles.cols7}>
          <span>{t('cashCheckBox', 'Cash [ ]')}</span>
          <span>{t('chequeCheckBox', 'Chequeu [ ]')}</span>
          <span>{t('shaCheckBox', 'SHA [ ]')}</span>
          <span>{t('scheme', 'Sheme [ ]')}</span>
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
