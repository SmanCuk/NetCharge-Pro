'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, GitCompare } from 'lucide-react';
import { format, differenceInDays, subMonths, subYears } from 'date-fns';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
  compareMode?: boolean;
  compareStartDate?: Date;
  compareEndDate?: Date;
  onCompareModeChange?: (enabled: boolean) => void;
  onCompareDateChange?: (start: Date, end: Date) => void;
}

export default function DateRangeFilter({ 
  startDate, 
  endDate, 
  onDateChange,
  compareMode = false,
  compareStartDate,
  compareEndDate,
  onCompareModeChange,
  onCompareDateChange
}: DateRangeFilterProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [localCompareStart, setLocalCompareStart] = useState(compareStartDate || subMonths(startDate, 1));
  const [localCompareEnd, setLocalCompareEnd] = useState(compareEndDate || subMonths(endDate, 1));

  // Sync with props
  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (compareStartDate) setLocalCompareStart(compareStartDate);
    if (compareEndDate) setLocalCompareEnd(compareEndDate);
  }, [compareStartDate, compareEndDate]);

  const isPresetActive = (preset: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(localStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(localEndDate);
    end.setHours(0, 0, 0, 0);
    
    const daysDiff = differenceInDays(end, start);
    
    switch (preset) {
      case 'today':
        return daysDiff === 0 && differenceInDays(today, start) === 0;
      case '7days':
        return daysDiff >= 6 && daysDiff <= 8;
      case '30days':
        return daysDiff >= 28 && daysDiff <= 31;
      case '90days':
        return daysDiff >= 88 && daysDiff <= 92;
      case 'thisMonth':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return differenceInDays(start, monthStart) === 0;
      case 'thisYear':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return differenceInDays(start, yearStart) === 0;
      default:
        return false;
    }
  };

  const handlePreset = (preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = today;

    switch (preset) {
      case 'today':
        start = today;
        break;
      case '7days':
        start.setDate(today.getDate() - 7);
        break;
      case '30days':
        start.setDate(today.getDate() - 30);
        break;
      case '90days':
        start.setDate(today.getDate() - 90);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        break;
    }

    setLocalStartDate(start);
    setLocalEndDate(end);
    setActivePreset(preset);
    onDateChange(start, end);
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setLocalStartDate(date);
      setActivePreset(null);
      onDateChange(date, localEndDate);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setLocalEndDate(date);
      setActivePreset(null);
      onDateChange(localStartDate, date);
    }
  };

  const handleCompareStartChange = (date: Date | null) => {
    if (date && onCompareDateChange) {
      setLocalCompareStart(date);
      onCompareDateChange(date, localCompareEnd);
    }
  };

  const handleCompareEndChange = (date: Date | null) => {
    if (date && onCompareDateChange) {
      setLocalCompareEnd(date);
      onCompareDateChange(localCompareStart, date);
    }
  };

  const handleQuickCompare = (type: 'lastMonth' | 'lastYear' | 'samePeriodLastYear') => {
    if (!onCompareModeChange || !onCompareDateChange) return;
    
    const daysDiff = differenceInDays(localEndDate, localStartDate);
    let compareStart: Date;
    let compareEnd: Date;

    switch (type) {
      case 'lastMonth':
        compareStart = subMonths(localStartDate, 1);
        compareEnd = subMonths(localEndDate, 1);
        break;
      case 'lastYear':
        compareStart = subYears(localStartDate, 1);
        compareEnd = subYears(localEndDate, 1);
        break;
      case 'samePeriodLastYear':
        compareStart = subYears(localStartDate, 1);
        compareEnd = subYears(localEndDate, 1);
        break;
    }

    setLocalCompareStart(compareStart);
    setLocalCompareEnd(compareEnd);
    onCompareModeChange(true);
    onCompareDateChange(compareStart, compareEnd);
  };

  const getButtonClass = (preset: string) => {
    const isActive = isPresetActive(preset);
    return `px-3 py-1 text-xs rounded-lg transition-colors font-medium ${
      isActive
        ? 'bg-primary-600 text-white shadow-md'
        : 'bg-gray-100 hover:bg-primary-100 hover:text-primary-700 text-gray-700'
    }`;
  };

  const daysDiff = differenceInDays(localEndDate, localStartDate);

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="text-primary-600" size={20} />
          <h3 className="text-sm font-semibold text-gray-700">Date Range Filter</h3>
        </div>
        <div className="flex items-center gap-3">
          {onCompareModeChange && (
            <button
              onClick={() => onCompareModeChange(!compareMode)}
              className={`flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all ${
                compareMode
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
              }`}
            >
              <GitCompare size={14} />
              <span className="font-medium">Compare Mode</span>
            </button>
          )}
          <span className="text-xs text-gray-500 font-medium">
            {daysDiff + 1} day{daysDiff !== 0 ? 's' : ''} selected
          </span>
        </div>
      </div>

      {/* Quick Compare Presets (show only in compare mode) */}
      {compareMode && onCompareModeChange && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-700 font-semibold mb-2">Quick Compare:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickCompare('lastMonth')}
              className="px-3 py-1 text-xs bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg transition-colors font-medium"
            >
              vs Last Month
            </button>
            <button
              onClick={() => handleQuickCompare('lastYear')}
              className="px-3 py-1 text-xs bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg transition-colors font-medium"
            >
              vs Last Year
            </button>
            <button
              onClick={() => handleQuickCompare('samePeriodLastYear')}
              className="px-3 py-1 text-xs bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg transition-colors font-medium"
            >
              vs Same Period Last Year
            </button>
          </div>
        </div>
      )}

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => handlePreset('today')} className={getButtonClass('today')}>
          Today
        </button>
        <button onClick={() => handlePreset('7days')} className={getButtonClass('7days')}>
          7 Days
        </button>
        <button onClick={() => handlePreset('30days')} className={getButtonClass('30days')}>
          30 Days
        </button>
        <button onClick={() => handlePreset('90days')} className={getButtonClass('90days')}>
          90 Days
        </button>
        <button onClick={() => handlePreset('thisMonth')} className={getButtonClass('thisMonth')}>
          This Month
        </button>
        <button onClick={() => handlePreset('lastMonth')} className={getButtonClass('lastMonth')}>
          Last Month
        </button>
        <button onClick={() => handlePreset('thisYear')} className={getButtonClass('thisYear')}>
          This Year
        </button>
      </div>

      {/* Custom Date Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Primary Date Range */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase">
            {compareMode ? 'Current Period' : 'Date Range'}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <DatePicker
                selected={localStartDate}
                onChange={handleStartDateChange}
                selectsStart
                startDate={localStartDate}
                endDate={localEndDate}
                maxDate={localEndDate}
                dateFormat="MMM dd, yyyy"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">End Date</label>
              <DatePicker
                selected={localEndDate}
                onChange={handleEndDateChange}
                selectsEnd
                startDate={localStartDate}
                endDate={localEndDate}
                minDate={localStartDate}
                maxDate={new Date()}
                dateFormat="MMM dd, yyyy"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Compare Date Range */}
        {compareMode && onCompareDateChange && (
          <div className="space-y-3 border-l-2 border-purple-300 pl-4">
            <p className="text-xs font-semibold text-purple-700 uppercase">Compare Period</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-purple-600 mb-1">Start Date</label>
                <DatePicker
                  selected={localCompareStart}
                  onChange={handleCompareStartChange}
                  selectsStart
                  startDate={localCompareStart}
                  endDate={localCompareEnd}
                  maxDate={localCompareEnd}
                  dateFormat="MMM dd, yyyy"
                  className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-purple-600 mb-1">End Date</label>
                <DatePicker
                  selected={localCompareEnd}
                  onChange={handleCompareEndChange}
                  selectsEnd
                  startDate={localCompareStart}
                  endDate={localCompareEnd}
                  minDate={localCompareStart}
                  maxDate={new Date()}
                  dateFormat="MMM dd, yyyy"
                  className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Range Display */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Selected Range:</span>
          <span className="font-semibold text-gray-700">
            {format(localStartDate, 'MMM dd, yyyy')} - {format(localEndDate, 'MMM dd, yyyy')}
          </span>
        </div>
        {compareMode && (
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-purple-500">Compare Range:</span>
            <span className="font-semibold text-purple-700">
              {format(localCompareStart, 'MMM dd, yyyy')} - {format(localCompareEnd, 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
