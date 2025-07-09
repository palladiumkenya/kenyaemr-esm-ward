import React, { FC, PropsWithChildren, useState } from 'react';
import styles from './ward-view.scss';
import { useTranslation } from 'react-i18next';
import { CardHeader } from '@openmrs/esm-patient-common-lib';
import { Tile } from '@carbon/react';
import { Search } from '@carbon/react';
import { ContentSwitcher } from '@carbon/react';
import { Switch } from '@carbon/react';

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
        <CardHeader title={t('wardOccupancy', 'Ward Occupancy')}>
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
        {/* <Search /> */}
        {selectedView === 1 && cardView}
        {selectedView === 0 && tableView}
      </div>
    </>
  );
};

export default WardViewContentWrapper;
