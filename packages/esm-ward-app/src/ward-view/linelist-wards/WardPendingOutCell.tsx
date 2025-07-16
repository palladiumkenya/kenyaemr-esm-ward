import { InlineLoading } from '@carbon/react';
import React, { type FC } from 'react';
import { useWardPatientGrouping } from '../../hooks/useWardPatientGrouping';

type WardPendingOutCellProps = {
  locationUuid: string;
};

const WardPendingOutCell: FC<WardPendingOutCellProps> = ({ locationUuid }) => {
  const { wardPatientPendingCount, isLoading } = useWardPatientGrouping(locationUuid);
  if (isLoading) return <InlineLoading />;
  return <div>{wardPatientPendingCount ?? '--'}</div>;
};

export default WardPendingOutCell;
