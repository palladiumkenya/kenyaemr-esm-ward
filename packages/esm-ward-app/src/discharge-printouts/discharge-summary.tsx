import React from 'react';
import styles from './discharge-printouts.scss';
import FieldInput from './field-input';
import { useTranslation } from 'react-i18next';
import { useSession } from '@openmrs/esm-framework';
const DischargeSummary = () => {
  const { t } = useTranslation();
  const session = useSession();
  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h5>{session.sessionLocation.display}</h5>
        <h5>{t('dischargeSummary', 'Discharge Summary')}</h5>
      </div>
      <div className={styles.cols3}>
        <FieldInput name={t('name', 'Name')} value={'Joyce Kamau'} />
        <FieldInput name={t('ipNo', 'IP No')} value={'345re34'} />
        <FieldInput name={t('age', 'Age')} value={'30 years'} />
      </div>
      <div className={styles.cols3}>
        <FieldInput name={t('sex', 'Sex')} value={'Female'} />
        <FieldInput name={t('dateOfAdmissionAbrv', 'DOA')} value={'02/07/2021'} />
        <FieldInput name={t('dateOfDischargeAbrv', 'DOD')} value={'02/07/2021'} />
      </div>
      <div className={styles.cols2}>
        <FieldInput name={t('nameOfConsultant', 'Name of consultant')} value={'Ann Waiguru'} />
        <FieldInput name={t('department', 'Department')} value={'Female Ward'} />
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
