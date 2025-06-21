/**
 * Utilidades para manejo de fechas en UTC
 * Evita problemas de zona horaria en filtros de base de datos
 */

/**
 * Obtiene el inicio del día actual en UTC (00:00:00.000Z)
 * Útil para filtros que incluyan "desde hoy"
 */
export const getStartOfTodayUTC = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
};

/**
 * Obtiene el final del día actual en UTC (23:59:59.999Z)
 * Útil para filtros que incluyan "hasta hoy"
 */
export const getEndOfTodayUTC = (): Date => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
  );
};

/**
 * Obtiene el inicio de una fecha específica en UTC (00:00:00.000Z)
 * @param date - Fecha a convertir (string ISO o Date object)
 */
export const getStartOfDateUTC = (date: string | Date): Date => {
  const dateObj = new Date(date);
  return new Date(
    Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 0, 0, 0, 0)
  );
};

/**
 * Obtiene el final de una fecha específica en UTC (23:59:59.999Z)
 * @param date - Fecha a convertir (string ISO o Date object)
 */
export const getEndOfDateUTC = (date: string | Date): Date => {
  const dateObj = new Date(date);
  return new Date(
    Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 23, 59, 59, 999)
  );
};

/**
 * Obtiene una fecha específica al mediodía UTC (12:00:00.000Z)
 * Útil para evitar problemas de zona horaria al guardar fechas en la DB
 * @param date - Fecha a convertir (string ISO o Date object)
 */
export const getDateAtNoonUTC = (date: string | Date): Date => {
  const dateObj = new Date(date);
  return new Date(
    Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 12, 0, 0, 0)
  );
};

/**
 * Verifica si una fecha es hoy en UTC
 * @param date - Fecha a verificar
 */
export const isToday = (date: string | Date): boolean => {
  const dateObj = new Date(date);
  const today = new Date();

  return (
    dateObj.getUTCFullYear() === today.getUTCFullYear() &&
    dateObj.getUTCMonth() === today.getUTCMonth() &&
    dateObj.getUTCDate() === today.getUTCDate()
  );
};

/**
 * Verifica si una fecha es futura (después de hoy) en UTC
 * @param date - Fecha a verificar
 */
export const isFutureDate = (date: string | Date): boolean => {
  const dateObj = getStartOfDateUTC(date);
  const startOfToday = getStartOfTodayUTC();

  return dateObj > startOfToday;
};

/**
 * Verifica si una fecha es hoy o futura en UTC
 * @param date - Fecha a verificar
 */
export const isTodayOrFuture = (date: string | Date): boolean => {
  const dateObj = getStartOfDateUTC(date);
  const startOfToday = getStartOfTodayUTC();

  return dateObj >= startOfToday;
};

/**
 * Crea filtros de fecha para MongoDB
 * Útil para rangos de fechas en consultas
 */
export const createDateFilters = (options: {
  from?: string | Date;
  to?: string | Date;
  includeFuture?: boolean;
  includeToday?: boolean;
}) => {
  const filters: any = {};

  if (options.from) {
    filters.$gte = getStartOfDateUTC(options.from);
  } else if (options.includeToday) {
    filters.$gte = getStartOfTodayUTC();
  } else if (options.includeFuture) {
    // Solo fechas futuras (excluye hoy)
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    filters.$gte = getStartOfDateUTC(tomorrow);
  }

  if (options.to) {
    filters.$lte = getEndOfDateUTC(options.to);
  }

  return Object.keys(filters).length > 0 ? filters : undefined;
};
