import React, { FC } from 'react';
import { useWardPatientGrouping } from '../../hooks/useWardPatientGrouping';
import { InlineLoading } from '@carbon/react';

type WardPendingOutCellProps = {
  locationUuid: string;
};

const WardPendingOutCell: FC<WardPendingOutCellProps> = ({ locationUuid }) => {
  const { wardPatientPendingCount, isLoading } = useWardPatientGrouping(locationUuid);
  if (isLoading) return <InlineLoading />;
  return <div>{wardPatientPendingCount ?? '--'}</div>;
};

export default WardPendingOutCell;
