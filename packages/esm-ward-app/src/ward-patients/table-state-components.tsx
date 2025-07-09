// Desclaimer: not using openmrs provided (EmptyState,ErrorState) to avoid repeated header titles and customize the message since provided ones are contexted to patient chart

import { Tile } from '@carbon/react';
import { EmptyDataIllustration } from '@openmrs/esm-patient-common-lib/src';
import React, { FC } from 'react';
import styles from './ward-patient.scss';
import { Information } from '@carbon/react/icons';
type EmptyStateProps = {
  message?: string;
};

export const EmptyState: FC<EmptyStateProps> = ({ message }) => {
  return (
    <Tile className={styles.empty}>
      <EmptyDataIllustration />
      <p>{message}</p>
    </Tile>
  );
};
type ErrorStateProps = {
  error?: Error;
};

export const ErrorState: FC<ErrorStateProps> = ({ error }) => {
  return (
    <Tile className={styles.error}>
      <Information size={60} className={styles.icon} />
      <strong>{(error as any)?.status}</strong>
      <p>{error?.message}</p>
    </Tile>
  );
};
