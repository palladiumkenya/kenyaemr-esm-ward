import { ContentSwitcher, Switch } from '@carbon/react';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import React, { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ward-view.scss';

type WardViewContentWrapperProps = {
  cardView: React.ReactNode;
  tableView: React.ReactNode;
};
const WardViewContentWrapper: FC<WardViewContentWrapperProps> = ({ cardView, tableView }) => {
  const { t } = useTranslation();
  const [selectedView, setSelectedView] = useState(0);
  return (
    <>
      <div className={styles.wrapperContainer}>
        <CardHeader title={t('wardPatients', 'Ward Patients')}>
          <ContentSwitcher
            onChange={({ index, name, text }) => {
              setSelectedView(index);
            }}
            className={styles.switcher}
            selectedIndex={selectedView}
            size="sm">
            <Switch name="list" text={t('listView', 'List')} />
            <Switch name="cards" text={t('cardView', 'Card')} />
          </ContentSwitcher>
        </CardHeader>
        {selectedView === 1 && cardView}
        {selectedView === 0 && tableView}
      </div>
    </>
  );
};

export default WardViewContentWrapper;
