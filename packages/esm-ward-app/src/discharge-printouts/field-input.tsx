import React, { type FC } from 'react';
import styles from './discharge-printouts.scss';
type FieldInputProps = {
  name: string;
  value?: string;
  delimiter?: string;
};

const FieldInput: FC<FieldInputProps> = ({ name: fieldName, value, delimiter = ':' }) => {
  return (
    <div className={styles.field}>
      <span className={styles.name}>
        {fieldName}
        {delimiter && `${delimiter} `}
      </span>
      <strong className={styles.value}>{value}</strong>
    </div>
  );
};

export default FieldInput;
