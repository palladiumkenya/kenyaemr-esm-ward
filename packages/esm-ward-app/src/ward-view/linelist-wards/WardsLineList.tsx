import React from 'react';
import Header from './Header';
import Filters from './Filters';
import Metrics from './Metrics';
import LineListTable from './LineListTable';
import { useTranslation } from 'react-i18next';

const WardsLineList = () => {
    const {t} = useTranslation()
  return (
    <div>
      <Header />
      <Filters />
      <Metrics />
      <LineListTable />
    </div>
  );
};

export default WardsLineList;
