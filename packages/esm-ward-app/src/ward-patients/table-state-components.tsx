// Desclaimer: not using openmrs provided (EmptyState,ErrorState) to avoid repeated header titles and customize the message since provided ones are contexted to patient chart

import { Tile } from '@carbon/react';
import { EmptyDataIllustration } from '@openmrs/esm-patient-common-lib';
import React, { FC } from 'react';
import styles from './ward-patient.scss';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <Tile className={styles.error}>
      <strong>
        {t('error', 'Error')} {`${(error as any)?.response?.status}: `}
        {(error as any)?.response?.statusText}
      </strong>
      <p>
        {t(
          'errorCopy',
          'Sorry, there was a problem displaying this information. You can try to reload this page, or contact the site administrator and quote the error code above.',
        )}
      </p>{' '}
    </Tile>
  );
};
