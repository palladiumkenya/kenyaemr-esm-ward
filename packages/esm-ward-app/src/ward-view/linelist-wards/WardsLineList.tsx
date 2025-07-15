import React, { useMemo } from 'react';
import Header from './Header';
import Filters from './Filters';
import Metrics from './Metrics';
import LineListTable from './LineListTable';
import { useTranslation } from 'react-i18next';

const WardsLineList = () => {
  const { t } = useTranslation();
  // TODO here to replace the mocked values
  const cards = useMemo(() => {
    return [
      { label: t('numberOfBeds', 'Number of Beds'), value: '40' },
      { label: t('admittedPatients', 'Admitted Patients'), value: '150' },
      { label: t('freebeds', 'Free Beds'), value: '20' },
      { label: t('bedOccupancy', 'Bed Occupancy %'), value: '50%' },
    ];
  }, [t]);
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
