import { Calendar, Location, LocationCompany, UserFollow } from '@carbon/react/icons';
import { formatDate, HomePictogram, useSession } from '@openmrs/esm-framework';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './linelist-wards.scss';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.header} id="admin-header">
      <div className={styles.leftJustifiedItems}>
        <HomePictogram className={styles.icon} />
        <div className={styles.pageLabels}>
          <p>{t('locations', 'Locations')}</p>
          <p className={styles.pageName}>{title}</p>
        </div>
      </div>
    </div>
  );
};

export default Header;
