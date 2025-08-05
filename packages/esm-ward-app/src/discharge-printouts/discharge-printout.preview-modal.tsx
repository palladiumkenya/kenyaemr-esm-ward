import { ModalHeader , ModalBody , ModalFooter , ButtonSet , Button } from '@carbon/react';
import React, { type FC, type ReactNode, useRef } from 'react';
import styles from './discharge-printouts.scss';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';

type DischargePrintoutPreviewModalProps = {
  printout: ReactNode;
  onClose: () => void;
};
const DischargePrintoutPreviewModal: FC<DischargePrintoutPreviewModalProps> = ({ onClose, printout }) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => ref.current,
  });
  return (
    <React.Fragment>
      <ModalHeader className={styles.sectionHeader} closeModal={onClose}>
        {t('printPreview', 'Print Preview')}
      </ModalHeader>
      <ModalBody>
        <div ref={ref}>{printout}</div>
      </ModalBody>
      <ModalFooter>
        <ButtonSet className={styles.buttonSet}>
          <Button kind="secondary" onClick={onClose} className={styles.button}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button kind="primary" onClick={handlePrint} className={styles.button}>
            {t('print', 'Print')}
          </Button>
        </ButtonSet>
      </ModalFooter>
    </React.Fragment>
  );
};

export default DischargePrintoutPreviewModal;
