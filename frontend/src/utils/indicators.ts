export function calculateSMA(data: {time: any, close: number}[], period: number) {
  const result = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    if (i >= period) {
      sum -= data[i - period].close;
      result.push({ time: data[i].time, value: sum / period });
    } else if (i === period - 1) {
      result.push({ time: data[i].time, value: sum / period });
    }
  }
  return result;
}

export function calculateEMA(data: {time: any, close: number}[], period: number) {
  const result = [];
  const k = 2 / (period + 1);
  let ema = data[0]?.close || 0;
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push({ time: data[i].time, value: ema });
    } else {
      ema = (data[i].close - ema) * k + ema;
      result.push({ time: data[i].time, value: ema });
    }
  }
  return result;
}
