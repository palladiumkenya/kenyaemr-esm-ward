import React, { useMemo } from 'react';
import Header from './Header';
import Filters from './Filters';
import Metrics from './Metrics';
import LineListTable from './LineListTable';
import { useTranslation } from 'react-i18next';
import { useWardsSummaryMetrics } from '../../hooks/useSummaryMetrics';

const WardsLineList = () => {
  const { t } = useTranslation();
  const summary = useWardsSummaryMetrics();
  const cards = useMemo(() => {
    return [
      { label: t('numberOfBeds', 'Number of Beds'), value: `${summary.totalBeds}` },
      { label: t('admittedPatients', 'Admitted Patients'), value: `${summary.admittedPatients}` },
      { label: t('freebeds', 'Free Beds'), value: `${summary.freeBeds}` },
      { label: t('bedOccupancy', 'Bed Occupancy %'), value: summary.bedOccupancy },
    ];
  }, [t, summary]);
  return (
    <div>
      <Header title={t('wards', 'Wards')} />
      <Filters />
      <Metrics metrics={cards} />
      <LineListTable />
    </div>
  );
};

export default WardsLineList;
