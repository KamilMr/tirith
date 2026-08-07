import cliModel from '../models/client.js';
import clientRateHistory from '../models/clientRateHistory.js';
import {retriveYYYYMMDD} from '../utils.js';

const clientService = {
  create: name => {
    if (!name || name.trim().length === 0)
      throw new Error('Client name cannot be empty');
    if (name.length > 50)
      throw new Error('Client name cannot exceed 50 characters');

    return cliModel.create(name);
  },
  selectAll: () => {
    return cliModel.listAll();
  },

  delete: client => cliModel.delete(client.id),

  update: (id, name) => {
    if (!name || name.trim().length === 0)
      throw new Error('Client name cannot be empty');
    if (name.length > 50)
      throw new Error('Client name cannot exceed 50 characters');

    return cliModel.edit(id, name);
  },

  updatePricing: async (
    id,
    {hourlyRate, currency = 'PLN', effectiveFrom = null},
  ) => {
    if (hourlyRate === null || hourlyRate === undefined)
      throw new Error('Hourly rate is required');
    if (isNaN(hourlyRate) || hourlyRate <= 0)
      throw new Error('Hourly rate must be a positive number');
    if (currency && currency.length !== 3)
      throw new Error('Currency must be a 3-letter code');

    const effectiveDate = effectiveFrom || retriveYYYYMMDD(new Date());

    // Create rate history entry
    await clientRateHistory.create({
      clientId: id,
      hourlyRate,
      currency,
      effectiveFrom: effectiveDate,
    });

    // Also update client table for quick access to current rate
    return cliModel.updatePricing(id, {hourlyRate, currency});
  },

  getCurrentRate: clientId => clientRateHistory.getCurrentRate(clientId),

  getRateHistory: clientId => clientRateHistory.getByClientId(clientId),

  updateWorkTargets: (id, {monthlyHours, dailyHours}) => {
    if (monthlyHours !== null && monthlyHours !== undefined) {
      const parsed = parseInt(monthlyHours, 10);
      if (isNaN(parsed) || parsed <= 0)
        throw new Error('Monthly hours must be a positive number');
      monthlyHours = parsed;
    }
    if (dailyHours !== null && dailyHours !== undefined) {
      const parsed = parseFloat(dailyHours);
      if (isNaN(parsed) || parsed <= 0)
        throw new Error('Daily hours must be a positive number');
      dailyHours = parsed;
    }
    return cliModel.updateWorkTargets(id, {monthlyHours, dailyHours});
  },

  updateAll: async (id, {name, hourlyRate, monthlyHours, dailyHours}) => {
    if (name !== undefined && name !== null) {
      const trimmed = name.trim();
      if (trimmed.length === 0) throw new Error('Client name cannot be empty');
      if (trimmed.length > 50)
        throw new Error('Client name cannot exceed 50 characters');
      await cliModel.edit(id, trimmed);
    }

    if (hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== '') {
      const parsed = parseInt(hourlyRate, 10);
      if (!isNaN(parsed) && parsed > 0) {
        const effectiveDate = retriveYYYYMMDD(new Date());
        await clientRateHistory.create({
          clientId: id,
          hourlyRate: parsed,
          currency: 'PLN',
          effectiveFrom: effectiveDate,
        });
        await cliModel.updatePricing(id, {hourlyRate: parsed, currency: 'PLN'});
      }
    }

    const workTargets = {};
    if (monthlyHours !== undefined)
      workTargets.monthlyHours = monthlyHours === '' ? null : monthlyHours;
    if (dailyHours !== undefined)
      workTargets.dailyHours = dailyHours === '' ? null : dailyHours;
    if (Object.keys(workTargets).length > 0)
      await cliModel.updateWorkTargets(id, workTargets);
  },

  selectById: id => cliModel.selectById(id),
};

export default clientService;
