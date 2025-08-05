import React, { type FC } from 'react';
import styles from './gate-pass.scss';
const GatePassPrintout = () => {
  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <h5>NYAHURUR COUNTY REFEREALL HOSPITAL</h5>
        <h5>WARD GATE PASS</h5>
      </div>
      <div className={styles.row1}>
        <FieldInput name="Paper No" value={'345re34'} />
        <FieldInput name="Patient No" value={'1234edee4'} />
        <FieldInput name="Date" value={'11/07/2021'} />
        <FieldInput name="Time" />
      </div>
      <div className={styles.row2}>
        <FieldInput name="Patient names" value={'Joyce Kamau'} />
        <FieldInput name="Age" value={'30 years'} />
      </div>
      <div className={styles.row3}>
        <FieldInput name="DOA" value={'02/07/2021'} />
        <FieldInput name="DOD" value={'02/07/2021'} />
      </div>

      <div>
        <p>Method of payment (tick as approximately)</p>
        <br />
        <div className={styles.paymentOptions}>
          <span>Cash [{'   '}]</span>
          <span>Chequeu [{'   '}]</span>
          <span>SHA [{'   '}]</span>
          <span>Sheme [{'   '}]</span>
          <span>M.R.M [{'   '}]</span>
          <FieldInput name="Other" />
        </div>
      </div>
      <p>
        <strong>Approved By</strong>
      </p>
      <div className={styles.signatory}>
        <FieldInput name="Account Ofiicer" />
        <FieldInput name="Sign" />
        <FieldInput name="Date" />
      </div>
      <div className={styles.signatory}>
        <FieldInput name="Health Record Officer" />
        <FieldInput name="Sign" />
        <FieldInput name="Date" />
      </div>
      <div className={styles.signatory}>
        <FieldInput name="Nurse In Charge" />
        <FieldInput name="Sign" />
        <FieldInput name="Date" />
      </div>
      <div className={styles.signatory}>
        <FieldInput name="Security Guard" />
        <FieldInput name="Sign" />
        <FieldInput name="Date" />
      </div>
      <p>
        <strong>N/B:</strong>
        <span>
          This form should be filled in duplicate, one copy to be retained in the ward and the other to be left in the
          main gate
        </span>
      </p>
    </div>
  );
};

export default GatePassPrintout;

type FieldInputProps = {
  name: string;
  value?: string;
};

const FieldInput: FC<FieldInputProps> = ({ name: fieldName, value }) => {
  return (
    <div className={styles.field}>
      <span className={styles.name}>{fieldName}: </span>
      <strong className={styles.value}>{value}</strong>
    </div>
  );
};
