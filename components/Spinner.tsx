import React from 'react';
import { BotIcon } from './icons';

const Spinner = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/50 rounded-lg animate-fadeInUp">
      <BotIcon className="w-12 h-12 text-teal-500 animate-pulse-soft" />
      <p className="mt-4 text-lg font-medium text-slate-700">{message}</p>
      <div className="mt-2 text-sm text-slate-500">Please wait, our AI is analyzing the data...</div>
    </div>
  );
};

export default Spinner;