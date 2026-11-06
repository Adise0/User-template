// How many seconds ago a date was. A missing date counts as infinitely long ago, so anything
// throttled on it is free to go.
const getSecondsSince = (date?: Date | null): number => {
  if (!date) {
    return Infinity;
  }

  return Math.floor((Date.now() - date.getTime()) / 1000);
};

export default getSecondsSince;
