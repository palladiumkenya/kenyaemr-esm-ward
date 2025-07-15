import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import AdmittedPatients from './admitted-patients';
import AwaitingAdmissionPatients from './awaiting-admission-patients';
import DischargeInPatients from './discharge-in-patients';
import DischargePatients from './discharge-patients';

const WardPatientsTable = () => {
  const { t } = useTranslation();

  return (
    <Tabs onTabCloseRequest={() => {}}>
      <TabList scrollDebounceWait={200}>
        <Tab>{t('awaitingAdmision', 'Awaiting Admission')}</Tab>
        <Tab>{t('admitted', 'Admitted')}</Tab>
        <Tab>{t('dischargeIn', 'Discharge In')}</Tab>
        <Tab>{t('discharge', 'Discharge')}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <AwaitingAdmissionPatients />
        </TabPanel>
        <TabPanel>
          <AdmittedPatients />
        </TabPanel>
        <TabPanel>
          <DischargeInPatients />
        </TabPanel>
        <TabPanel>
          <DischargePatients />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default WardPatientsTable;
