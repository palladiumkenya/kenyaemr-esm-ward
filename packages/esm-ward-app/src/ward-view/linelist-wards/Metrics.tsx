import React, { type FC, useMemo } from 'react';
import { Layer, Tile } from '@carbon/react';
import styles from './linelist-wards.scss';

type MetricsProps = {
  metrics: Array<{ label: string; value: string }>;
};
const Metrics: FC<MetricsProps> = ({ metrics }) => {
  return (
    <Layer className={styles.metricsContainer}>
      {metrics.map(({ label, value }) => (
        <Tile className={styles.metricCard}>
          <strong>{label}</strong>
          <h4 className={styles.metricValue}>{value ?? '--'}</h4>
        </Tile>
      ))}
    </Layer>
  );
};

export default Metrics;
