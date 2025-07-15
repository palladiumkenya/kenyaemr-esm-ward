import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import WardView from './ward-view/ward-view.component';
import WardsLineList from './ward-view/linelist-wards/WardsLineList';

const Root: React.FC = () => {
  // t('wards', 'Wards')
  const wardViewBasename = window.getOpenmrsSpaBase() + 'home/ward';

  return (
    <main>
      <BrowserRouter basename={wardViewBasename}>
        <Routes>
          <Route path="/" element={<WardsLineList />} />
          <Route path="/:locationUuid" element={<WardView />} />
        </Routes>
      </BrowserRouter>
    </main>
  );
};

export default Root;
