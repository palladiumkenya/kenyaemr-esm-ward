import { Layer } from '@carbon/react';
import React, { useMemo } from 'react';
import styles from './linelist-wards.scss';
import { useTranslation } from 'react-i18next';
import { Tile } from '@carbon/react';
const Metrics = () => {
  const { t } = useTranslation();
  const cards = useMemo(() => {
    return [
      { label: t('numberOfBeds', 'Number of Beds'), value: '40' },
      { label: t('admittedPatients', 'Admitted Patients'), value: '150' },
      { label: t('freebeds', 'Free Beds'), value: '20' },
      { label: t('bedOccupancy', 'Bed Occupancy %'), value: '50%' },
    ];
  }, [t]);
  return (
    <Layer className={styles.metricsContainer}>
      {cards.map(({ label, value }) => (
        <Tile className={styles.metricCard}>
          <strong>{label}</strong>
          <h4 className={styles.metricValue}>{value ?? '--'}</h4>
        </Tile>
      ))}
    </Layer>
  );
};

export default Metrics;
